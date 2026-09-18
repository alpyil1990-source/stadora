/**
 * Internal STADORA document-access API.
 * Secrets come from environment variables. Storage paths are never returned to clients.
 */
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join, normalize, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

const scrypt = promisify(scryptCb)
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const INTERNAL = join(ROOT, 'internal')
const STORAGE = join(INTERNAL, 'storage')
const DB = join(INTERNAL, 'db')
const MAIL = join(INTERNAL, 'mail')
const PORT = Number(process.env.STADORA_API_PORT || 4318)

type Role = 'customer' | 'admin'
type Access = 'internal_only' | 'registered_customer' | 'public'
type User = {
  id: string
  email: string
  password: string
  role: Role
  verified: boolean
  newsletter: boolean
  name?: string
  company?: string
  createdAt: string
  deletedAt?: string
}
type Session = { id: string; userId: string; createdAt: string; expiresAt: string }
type Token = { id: string; userId: string; kind: 'verify' | 'reset'; hash: string; expiresAt: string }
type FileRec = {
  id: string
  supplier: string
  sku: string
  productSlug: string
  kind: string
  typeLabel: string
  format: string
  access: Access
  originalName: string
  storageName: string
  relPath: string
  sourceUrl: string
  bytes: number
}
type DownloadLog = {
  id: string
  at: string
  userId: string
  email: string
  role: Role | 'staff'
  productSlug: string
  sku: string
  documentName: string
  documentType: string
  supplier: string
}

function loadDotEnv() {
  const p = join(ROOT, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    const k = t.slice(0, i).trim()
    if (k && process.env[k] == null) process.env[k] = t.slice(i + 1).trim()
  }
}

loadDotEnv()

const FILE_SECRET = process.env.STADORA_FILE_SECRET || randomBytes(32).toString('hex')
const SESSION_SECRET = process.env.STADORA_SESSION_SECRET || randomBytes(32).toString('hex')
const ADMIN_EMAIL = (process.env.STADORA_ADMIN_EMAIL || 'admin@stadora.se').toLowerCase()

function ensureDirs() {
  for (const d of [DB, MAIL, STORAGE]) mkdirSync(d, { recursive: true })
}

function readJson<T>(name: string, fallback: T): T {
  const p = join(DB, name)
  if (!existsSync(p)) return fallback
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(name: string, value: unknown) {
  const p = join(DB, name)
  writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`)
}

type Db = {
  users: User[]
  sessions: Session[]
  tokens: Token[]
  downloads: DownloadLog[]
}

function db(): Db {
  return {
    users: readJson('users.json', { users: [] as User[] }).users ?? readJson('users.json', [] as User[]),
    sessions: readJson('sessions.json', { sessions: [] as Session[] }).sessions ?? [],
    tokens: readJson('tokens.json', { tokens: [] as Token[] }).tokens ?? [],
    downloads: readJson('downloads.json', { downloads: [] as DownloadLog[] }).downloads ?? [],
  }
}

function saveUsers(users: User[]) {
  writeJson('users.json', { users })
}
function saveSessions(sessions: Session[]) {
  writeJson('sessions.json', { sessions })
}
function saveTokens(tokens: Token[]) {
  writeJson('tokens.json', { tokens })
}
function saveDownloads(downloads: DownloadLog[]) {
  writeJson('downloads.json', { downloads })
}

function filesIndex(): FileRec[] {
  const raw = readJson<{ files?: FileRec[] }>('files.json', { files: [] })
  return raw.files ?? []
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

function b64url(buf: Buffer) {
  return buf.toString('base64url')
}

async function hashPassword(plain: string) {
  const salt = randomBytes(16)
  const hash = (await scrypt(plain, salt, 32)) as Buffer
  return `scrypt$16384$8$1$${salt.toString('hex')}$${hash.toString('hex')}`
}

async function verifyPassword(plain: string, stored: string) {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[4], 'hex')
  const expected = Buffer.from(parts[5], 'hex')
  const got = (await scrypt(plain, salt, expected.length)) as Buffer
  return got.length === expected.length && timingSafeEqual(got, expected)
}

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    verified: u.verified,
    newsletter: u.newsletter,
    name: u.name ?? '',
    company: u.company ?? '',
  }
}

function nowIso() {
  return new Date().toISOString()
}

function addHours(h: number) {
  return new Date(Date.now() + h * 3600_000).toISOString()
}

function ipOf(c: { req: { header: (n: string) => string | undefined; raw?: unknown } }) {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs: number) {
  const t = Date.now()
  const prev = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
  if (prev.length >= max) return true
  prev.push(t)
  hits.set(key, prev)
  return false
}

function writeMail(kind: string, to: string, subject: string, text: string, link?: string) {
  mkdirSync(MAIL, { recursive: true })
  const id = `${Date.now()}-${randomBytes(4).toString('hex')}`
  const rec = { id, kind, to, subject, text, link, at: nowIso(), sent: false }
  writeFileSync(join(MAIL, `${id}.json`), `${JSON.stringify(rec, null, 2)}\n`)
  return rec
}

async function seedAdmin() {
  const data = db()
  if (data.users.some((u) => u.role === 'admin' && !u.deletedAt)) return
  const password = process.env.STADORA_ADMIN_PASSWORD
  if (!password) return
  const user: User = {
    id: `usr_${randomBytes(6).toString('hex')}`,
    email: ADMIN_EMAIL,
    password: await hashPassword(password),
    role: 'admin',
    verified: true,
    newsletter: false,
    createdAt: nowIso(),
  }
  saveUsers([...data.users, user])
}

function fileById(id: string) {
  return filesIndex().find((f) => f.id === id)
}

function safeStoragePath(rel: string) {
  const resolved = resolve(STORAGE, rel)
  if (!resolved.startsWith(STORAGE)) return null
  const norm = normalize(resolved)
  if (!norm.startsWith(STORAGE)) return null
  return existsSync(norm) ? norm : null
}

function canRead(file: FileRec, user: User | null, staff: boolean) {
  if (file.access === 'public') return true
  if (staff) return true
  if (!user || user.deletedAt) return false
  if (user.role === 'admin') return true
  if (file.access === 'registered_customer' && user.verified) return true
  return false
}

function signedFileToken(fileId: string, who: string, minutes = 10) {
  const exp = Date.now() + minutes * 60_000
  const payload = `${fileId}.${who}.${exp}`
  return `${payload}.${sign(payload, FILE_SECRET)}`
}

function readSignedToken(token: string) {
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [fileId, who, exp, sig] = parts
  const payload = `${fileId}.${who}.${exp}`
  const expect = sign(payload, FILE_SECRET)
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null
  if (Number(exp) < Date.now()) return null
  return { fileId, who }
}

const app = new Hono()

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Cache-Control', 'no-store')
  await next()
})

function isStaffCookie(c: { req: { raw: Request } }) {
  const v = getCookie(c as never, 'stadora_preview')
  if (!v) return false
  const expect = sign('staff-preview', SESSION_SECRET)
  try {
    return expect.length === v.length && timingSafeEqual(Buffer.from(expect), Buffer.from(v))
  } catch {
    return false
  }
}

function isDocumentFile(file: FileRec) {
  if (file.kind === 'studio' || file.kind === 'detail' || file.kind === 'site') return false
  if (file.typeLabel === 'Produktbild') return false
  return true
}

function userFrom(c: { req: { raw: Request } }) {
  const sid = getCookie(c as never, 'stadora_sid')
  const staffCookie = isStaffCookie(c)
  if (!sid) return { user: null as User | null, staff: staffCookie }
  const data = db()
  const sess = data.sessions.find((s) => s.id === sid && s.expiresAt > nowIso())
  const user = sess ? data.users.find((u) => u.id === sess.userId && !u.deletedAt) ?? null : null
  const staff = staffCookie || user?.role === 'admin'
  return { user, staff }
}

app.get('/api/health', (c) => c.json({ ok: true, env: 'internal-test' }))

app.post('/api/preview/enter', (c) => {
  const token = sign('staff-preview', SESSION_SECRET)
  setCookie(c, 'stadora_preview', token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return c.json({ ok: true })
})

app.get('/api/me', (c) => {
  const { user } = userFrom(c)
  return c.json({ user: user ? publicUser(user) : null })
})

app.post('/api/register', async (c) => {
  if (limited(`reg:${ipOf(c)}`, 5, 60 * 60 * 1000)) return c.json({ error: 'För många försök. Vänta en stund.' }, 429)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  if (typeof body.company_url === 'string' && body.company_url.trim()) {
    return c.json({ error: 'Registreringen kunde inte slutföras.' }, 400)
  }
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const password = String(body.password || '')
  const privacy = Boolean(body.privacy)
  const newsletter = Boolean(body.newsletter)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Ange en giltig e-postadress.' }, 400)
  if (password.length < 10) return c.json({ error: 'Lösenordet ska vara minst 10 tecken.' }, 400)
  if (!privacy) return c.json({ error: 'Du behöver godkänna integritetspolicyn.' }, 400)
  const data = db()
  if (data.users.some((u) => u.email === email && !u.deletedAt)) {
    return c.json({ error: 'Det finns redan ett konto med den adressen.' }, 409)
  }
  const user: User = {
    id: `usr_${randomBytes(6).toString('hex')}`,
    email,
    password: await hashPassword(password),
    role: 'customer',
    verified: false,
    newsletter,
    createdAt: nowIso(),
  }
  saveUsers([...data.users, user])
  const raw = b64url(randomBytes(32))
  const token: Token = {
    id: `tok_${randomBytes(4).toString('hex')}`,
    userId: user.id,
    kind: 'verify',
    hash: sign(raw, SESSION_SECRET),
    expiresAt: addHours(24),
  }
  saveTokens([...db().tokens, token])
  const link = `http://127.0.0.1:4317/konto/bekrafta?token=${raw}`
  writeMail(
    'verify',
    email,
    'Bekräfta din e-post hos STADORA',
    `Bekräfta e-postadressen för dokumentåtkomst. Länken gäller 24 timmar.\n\n${link}\n\nRegistreringen ger inte nyhetsbrev om du inte kryssat i det valet.`,
    link,
  )
  return c.json({ ok: true, message: 'Kolla intern testbrevlåda för bekräftelselänk. Inget externt mejl skickas i testmiljön.' })
})

app.post('/api/verify', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const raw = String(body.token || '')
  const data = db()
  const hash = sign(raw, SESSION_SECRET)
  const token = data.tokens.find((t) => t.kind === 'verify' && t.hash === hash && t.expiresAt > nowIso())
  if (!token) return c.json({ error: 'Länken är ogiltig eller har gått ut.' }, 400)
  saveUsers(data.users.map((u) => (u.id === token.userId ? { ...u, verified: true } : u)))
  saveTokens(data.tokens.filter((t) => t.id !== token.id))
  return c.json({ ok: true })
})

app.post('/api/login', async (c) => {
  if (limited(`login:${ipOf(c)}`, 10, 15 * 60 * 1000)) return c.json({ error: 'För många inloggningsförsök.' }, 429)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const password = String(body.password || '')
  const data = db()
  const user = data.users.find((u) => u.email === email && !u.deletedAt)
  if (!user || !(await verifyPassword(password, user.password))) {
    return c.json({ error: 'Fel e-post eller lösenord.' }, 401)
  }
  const sess: Session = {
    id: b64url(randomBytes(24)),
    userId: user.id,
    createdAt: nowIso(),
    expiresAt: addHours(24 * 7),
  }
  saveSessions([...data.sessions.filter((s) => s.expiresAt > nowIso()), sess])
  setCookie(c, 'stadora_sid', sess.id, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return c.json({ user: publicUser(user) })
})

app.post('/api/logout', (c) => {
  const sid = getCookie(c, 'stadora_sid')
  if (sid) saveSessions(db().sessions.filter((s) => s.id !== sid))
  deleteCookie(c, 'stadora_sid', { path: '/' })
  return c.json({ ok: true })
})

app.post('/api/forgot', async (c) => {
  if (limited(`forgot:${ipOf(c)}`, 5, 60 * 60 * 1000)) return c.json({ error: 'För många försök.' }, 429)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const user = db().users.find((u) => u.email === email && !u.deletedAt)
  if (user) {
    const raw = b64url(randomBytes(32))
    saveTokens([
      ...db().tokens,
      {
        id: `tok_${randomBytes(4).toString('hex')}`,
        userId: user.id,
        kind: 'reset',
        hash: sign(raw, SESSION_SECRET),
        expiresAt: addHours(2),
      },
    ])
    const link = `http://127.0.0.1:4317/konto/aterstall?token=${raw}`
    writeMail('reset', email, 'Återställ lösenord — STADORA', `Länken gäller två timmar.\n\n${link}`, link)
  }
  return c.json({ ok: true, message: 'Om adressen finns skickas en länk till den interna testbrevlådan.' })
})

app.post('/api/reset', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const raw = String(body.token || '')
  const password = String(body.password || '')
  if (password.length < 10) return c.json({ error: 'Lösenordet ska vara minst 10 tecken.' }, 400)
  const hash = sign(raw, SESSION_SECRET)
  const token = db().tokens.find((t) => t.kind === 'reset' && t.hash === hash && t.expiresAt > nowIso())
  if (!token) return c.json({ error: 'Länken är ogiltig eller har gått ut.' }, 400)
  const hashed = await hashPassword(password)
  saveUsers(db().users.map((u) => (u.id === token.userId ? { ...u, password: hashed } : u)))
  saveTokens(db().tokens.filter((t) => t.id !== token.id))
  saveSessions(db().sessions.filter((s) => s.userId !== token.userId))
  return c.json({ ok: true })
})

app.post('/api/profile', async (c) => {
  const { user } = userFrom(c)
  if (!user) return c.json({ error: 'Inte inloggad.' }, 401)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const name = String(body.name ?? user.name ?? '').slice(0, 120)
  const company = String(body.company ?? user.company ?? '').slice(0, 160)
  const newsletter = Boolean(body.newsletter)
  saveUsers(db().users.map((u) => (u.id === user.id ? { ...u, name, company, newsletter } : u)))
  return c.json({ user: publicUser({ ...user, name, company, newsletter }) })
})

app.post('/api/account/delete', async (c) => {
  const { user } = userFrom(c)
  if (!user) return c.json({ error: 'Inte inloggad.' }, 401)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const password = String(body.password || '')
  if (!(await verifyPassword(password, user.password))) return c.json({ error: 'Fel lösenord.' }, 401)
  saveUsers(db().users.map((u) => (u.id === user.id ? { ...u, deletedAt: nowIso(), email: `deleted-${u.id}@invalid` } : u)))
  saveDownloads(
    db().downloads.map((d) =>
      d.userId === user.id ? { ...d, userId: 'deleted', email: 'raderat konto' } : d,
    ),
  )
  saveSessions(db().sessions.filter((s) => s.userId !== user.id))
  deleteCookie(c, 'stadora_sid', { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/files/:id', (c) => {
  const { user, staff } = userFrom(c)
  const file = fileById(c.req.param('id'))
  if (!file) return c.json({ error: 'Filen finns inte.' }, 404)
  if (!canRead(file, user, staff)) {
    return c.json({ error: 'Ingen behörighet. Originalfiler från nya leverantörer är interna tills vidare.' }, 403)
  }
  const who = user?.id || (staff ? 'staff' : 'anon')
  const token = signedFileToken(file.id, who)
  return c.redirect(`/api/d/${token}`)
})

app.get('/api/d/:token', (c) => {
  const parsed = readSignedToken(c.req.param('token'))
  if (!parsed) return c.json({ error: 'Länken har gått ut. Begär filen på nytt.' }, 403)
  const file = fileById(parsed.fileId)
  if (!file) return c.json({ error: 'Filen finns inte.' }, 404)
  const { user, staff } = userFrom(c)
  if (!canRead(file, user, staff)) return c.json({ error: 'Ingen behörighet.' }, 403)
  const path = safeStoragePath(file.relPath)
  if (!path) return c.json({ error: 'Filen saknas i intern lagring.' }, 404)
  if (isDocumentFile(file)) {
    saveDownloads([
      ...db().downloads,
      {
        id: `dl_${randomBytes(4).toString('hex')}`,
        at: nowIso(),
        userId: user?.id || 'staff',
        email: user?.email || 'intern-förhandsgranskning',
        role: user?.role || 'staff',
        productSlug: file.productSlug,
        sku: file.sku,
        documentName: file.originalName,
        documentType: file.typeLabel,
        supplier: file.supplier,
      },
    ])
  }
  const mime =
    {
      PDF: 'application/pdf',
      JPG: 'image/jpeg',
      JPEG: 'image/jpeg',
      PNG: 'image/png',
      GLB: 'model/gltf-binary',
      DWG: 'application/acad',
      '3DS': 'application/octet-stream',
    }[file.format] || 'application/octet-stream'
  const web = Readable.toWeb(createReadStream(path)) as ReadableStream
  return new Response(web, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${file.storageName.replace(/"/g, '')}"`,
    },
  })
})

app.get('/api/admin/accounts', (c) => {
  const { user } = userFrom(c)
  if (user?.role !== 'admin' && !userFrom(c).staff) return c.json({ error: 'Endast admin.' }, 403)
  const rows = db()
    .users.filter((u) => !u.deletedAt)
    .map((u) => ({
      ...publicUser(u),
      createdAt: u.createdAt,
      downloads: db().downloads.filter((d) => d.userId === u.id).length,
    }))
  return c.json({ accounts: rows })
})

app.get('/api/admin/downloads', (c) => {
  const { user, staff } = userFrom(c)
  if (user?.role !== 'admin' && !staff) return c.json({ error: 'Endast admin.' }, 403)
  const supplier = c.req.query('supplier') || ''
  const from = c.req.query('from') || ''
  const to = c.req.query('to') || ''
  let rows = db().downloads
  if (supplier) rows = rows.filter((d) => d.supplier.toLowerCase() === supplier.toLowerCase())
  if (from) rows = rows.filter((d) => d.at >= from)
  if (to) rows = rows.filter((d) => d.at <= `${to}T23:59:59`)
  const byProduct = new Map<string, { productSlug: string; sku: string; downloads: number; users: Set<string> }>()
  for (const d of rows) {
    const cur = byProduct.get(d.productSlug) ?? {
      productSlug: d.productSlug,
      sku: d.sku,
      downloads: 0,
      users: new Set<string>(),
    }
    cur.downloads += 1
    cur.users.add(d.userId)
    byProduct.set(d.productSlug, cur)
  }
  return c.json({
    downloads: rows,
    products: [...byProduct.values()]
      .map((p) => ({ ...p, uniqueUsers: p.users.size, users: undefined }))
      .sort((a, b) => b.downloads - a.downloads),
  })
})

app.get('/api/admin/downloads.csv', (c) => {
  const { user, staff } = userFrom(c)
  if (user?.role !== 'admin' && !staff) return c.json({ error: 'Endast admin.' }, 403)
  const supplier = c.req.query('supplier') || ''
  const from = c.req.query('from') || ''
  const to = c.req.query('to') || ''
  let rows = db().downloads
  if (supplier) rows = rows.filter((d) => d.supplier.toLowerCase() === supplier.toLowerCase())
  if (from) rows = rows.filter((d) => d.at >= from)
  if (to) rows = rows.filter((d) => d.at <= `${to}T23:59:59`)
  const header = ['tid', 'anvandar-id', 'epost', 'produkt', 'artikelnummer', 'dokumentnamn', 'dokumenttyp', 'leverantor']
  const lines = [header.join(',')]
  for (const d of rows) {
    const cells = [d.at, d.userId, d.email, d.productSlug, d.sku, d.documentName, d.documentType, d.supplier].map(
      (v) => `"${String(v).replace(/"/g, '""')}"`,
    )
    lines.push(cells.join(','))
  }
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="stadora-dokumentlogg.csv"')
  return c.body(lines.join('\n'))
})

app.get('/api/admin/mail', async (c) => {
  const { user, staff } = userFrom(c)
  if (user?.role !== 'admin' && !staff) return c.json({ error: 'Endast admin.' }, 403)
  if (!existsSync(MAIL)) return c.json({ messages: [] })
  const names = (await readdir(MAIL)).filter((n) => n.endsWith('.json')).sort().reverse()
  const messages = names.slice(0, 50).map((n) => JSON.parse(readFileSync(join(MAIL, n), 'utf8')))
  return c.json({ messages })
})

ensureDirs()
await seedAdmin()

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0', createServer })
console.log(`STADORA document API on http://127.0.0.1:${PORT}`)
