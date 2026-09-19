#!/usr/bin/env python3
"""Log in to vvz-play.com and attach DWG files as STADORA-gated CAD.

Credentials are read from VVZ_USER and VVZ_PASSWORD in the environment only.
They are never written to JSON, logs, git, .env, or any file in this repo.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import time
import urllib.parse
from datetime import date
from pathlib import Path

import websocket

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "src" / "data" / "generated"
SERIES_PATH = GEN / "vvz-play-series.json"
DOC_ROOT = ROOT / "public" / "docs" / "vvz-play"
FETCHED_AT = date.today().isoformat()
DEBUG_PORT = int(os.environ.get("VVZ_CDP_PORT") or "9333")
PROFILE = Path(os.environ.get("VVZ_CHROME_PROFILE") or "/tmp/vvz-chrome-profile")
CHROME = os.environ.get("VVZ_CHROME") or "/usr/bin/google-chrome-stable"


def load_importer():
    path = ROOT / "scripts" / "import-vvz-play.py"
    spec = importlib.util.spec_from_file_location("vvz_import", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load import-vvz-play.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


imp = load_importer()


class Cdp:
    def __init__(self, url: str):
        self.ws = websocket.create_connection(url, timeout=60)
        self.n = 0

    def call(self, method: str, params: dict | None = None, timeout: float = 60):
        self.n += 1
        mid = self.n
        self.ws.settimeout(timeout)
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        deadline = time.time() + timeout
        while time.time() < deadline:
            raw = self.ws.recv()
            msg = json.loads(raw)
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result") or {}
        raise TimeoutError(method)

    def eval(self, expression: str, await_promise: bool = False):
        result = self.call(
            "Runtime.evaluate",
            {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": await_promise,
            },
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(result["exceptionDetails"])
        return (result.get("result") or {}).get("value")

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass


def wait_port(port: int, tries: int = 40) -> None:
    import urllib.request

    url = f"http://127.0.0.1:{port}/json/version"
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                json.loads(resp.read().decode())
            return
        except Exception:
            time.sleep(0.25)
    raise RuntimeError(f"Chrome CDP not up on {port}")


def json_get(path: str):
    import urllib.request

    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}{path}", timeout=10) as resp:
        return json.loads(resp.read().decode())


def start_chrome() -> subprocess.Popen:
    PROFILE.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["DISPLAY"] = env.get("DISPLAY") or ":1"
    cmd = [
        CHROME,
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--password-store=basic",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-blink-features=AutomationControlled",
        "--remote-allow-origins=*",
        f"--remote-debugging-port={DEBUG_PORT}",
        f"--user-data-dir={PROFILE}",
        "--window-size=1280,900",
        "about:blank",
    ]
    return subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def page_ws() -> str:
    pages = json_get("/json/list")
    for p in pages:
        if p.get("type") == "page" and p.get("webSocketDebuggerUrl"):
            return p["webSocketDebuggerUrl"]
    created = json_get("/json/new?about:blank")
    return created["webSocketDebuggerUrl"]


def navigate(cdp: Cdp, url: str) -> None:
    cdp.call("Page.enable")
    cdp.call("Page.navigate", {"url": url})
    for _ in range(80):
        ready = cdp.eval("document.readyState")
        if ready == "complete":
            return
        time.sleep(0.25)


def recaptcha_anchor_click() -> bool:
    try:
        pages = json_get("/json/list")
    except Exception:
        return False
    for p in pages:
        url = p.get("url") or ""
        ws = p.get("webSocketDebuggerUrl")
        if "recaptcha" in url and "anchor" in url and ws:
            frame = Cdp(ws)
            try:
                frame.call("Runtime.enable")
                clicked = frame.eval(
                    """
                    (() => {
                      const a = document.getElementById('recaptcha-anchor');
                      if (a) { a.click(); return true; }
                      return false;
                    })()
                    """
                )
                print("anchor click", clicked)
                return bool(clicked)
            except Exception as exc:
                print("anchor fail", type(exc).__name__)
            finally:
                frame.close()
    return False


def recaptcha_skip_or_verify() -> str:
    try:
        pages = json_get("/json/list")
    except Exception:
        return ""
    for p in pages:
        url = p.get("url") or ""
        ws = p.get("webSocketDebuggerUrl")
        if "recaptcha" in url and "bframe" in url and ws:
            frame = Cdp(ws)
            try:
                frame.call("Runtime.enable")
                text = frame.eval("document.body ? document.body.innerText.slice(0, 300) : ''") or ""
                print("bframe", text.replace("\n", " ")[:180])
                if "skip" in text.lower():
                    frame.eval("document.getElementById('recaptcha-verify-button')?.click()")
                    # SKIP is often the verify button label
                    frame.eval(
                        """
                        (() => {
                          const b = document.getElementById('recaptcha-verify-button');
                          if (b) b.click();
                          const skip = [...document.querySelectorAll('button')].find(x => /skip/i.test(x.textContent||''));
                          if (skip) skip.click();
                        })()
                        """
                    )
                    return "skip"
            except Exception as exc:
                print("bframe fail", type(exc).__name__)
            finally:
                frame.close()
    return ""


def mouse_click(cdp: Cdp, x: float, y: float) -> None:
    for typ in ("mousePressed", "mouseReleased"):
        cdp.call(
            "Input.dispatchMouseEvent",
            {"type": typ, "x": x, "y": y, "button": "left", "clickCount": 1},
        )


def click_selector(cdp: Cdp, selector: str) -> bool:
    box = cdp.eval(
        """
        (() => {
          const el = document.querySelector(%s);
          if (!el) return null;
          el.scrollIntoView({block:'center'});
          const r = el.getBoundingClientRect();
          return {x: r.x + r.width/2, y: r.y + r.height/2};
        })()
        """
        % json.dumps(selector)
    )
    if not box:
        return False
    mouse_click(cdp, box["x"], box["y"])
    return True


def dismiss_cookies(cdp: Cdp) -> None:
    info = cdp.eval(
        r"""
        (() => {
          function allNodes(root, acc) {
            const tree = root.querySelectorAll ? root.querySelectorAll('*') : [];
            for (const el of tree) {
              acc.push(el);
              if (el.shadowRoot) allNodes(el.shadowRoot, acc);
            }
            const docs = root.querySelectorAll ? root.querySelectorAll('iframe') : [];
            for (const frame of docs) {
              try {
                if (frame.contentDocument) allNodes(frame.contentDocument, acc);
              } catch (e) {}
            }
          }
          const nodes = [];
          allNodes(document, nodes);
          const hit = nodes.find((el) => {
            const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            return /^(i understand|accept all|accept)$/i.test(t);
          });
          if (hit) {
            hit.click();
            return 'clicked:' + hit.tagName + ':' + (hit.className || '');
          }
          return {
            privacy: document.body.innerText.includes('We care about your privacy'),
            buttons: nodes
              .map((b) => (b.innerText || b.textContent || '').replace(/\s+/g, ' ').trim())
              .filter((t) => t && t.length < 24)
              .slice(0, 20),
          };
        })()
        """
    )
    print("cookies", info)
    time.sleep(0.6)


def login(cdp: Cdp) -> bool:
    user = (os.environ.get("VVZ_USER") or "").strip()
    password = os.environ.get("VVZ_PASSWORD") or ""
    if not user or not password:
        print("VVZ_USER / VVZ_PASSWORD not set — DWG stays locked.", file=sys.stderr)
        return False
    cdp.call("Page.enable")
    cdp.call("Runtime.enable")
    cdp.call(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        },
    )
    navigate(cdp, "https://www.vvz-play.com/profile/login/")
    time.sleep(1.5)
    for _ in range(8):
        dismiss_cookies(cdp)
        visible = cdp.eval("document.body && document.body.innerText.includes('We care about your privacy')")
        if not visible:
            break
        time.sleep(0.7)
    if cdp.eval("document.body && document.body.innerText.includes('We care about your privacy')"):
        size = cdp.eval("[window.innerWidth, window.innerHeight]")
        if size:
            mouse_click(cdp, size[0] * 0.72, size[1] * 0.70)
            time.sleep(0.8)
    if not click_selector(cdp, 'input[name="login-email"]'):
        print("login form missing")
        return False
    time.sleep(0.3)
    cdp.eval(
        """
        (() => {
          const email = document.querySelector('input[name="login-email"]');
          if (!email) return false;
          email.focus();
          email.dispatchEvent(new Event('focus', {bubbles:true}));
          email.dispatchEvent(new KeyboardEvent('keyup', {bubbles:true}));
          return true;
        })()
        """
    )
    time.sleep(1.2)
    cdp.call("Input.insertText", {"text": user})
    time.sleep(0.4)
    click_selector(cdp, 'input[name="login-pass"]')
    time.sleep(0.2)
    cdp.call("Input.insertText", {"text": password})
    time.sleep(0.4)
    dismiss_cookies(cdp)
    if cdp.eval("document.body && document.body.innerText.includes('We care about your privacy')"):
        size = cdp.eval("[window.innerWidth, window.innerHeight]")
        if size:
            mouse_click(cdp, size[0] * 0.72, size[1] * 0.70)
            time.sleep(0.8)
    cdp.eval(
        """
        (() => {
          const keep = document.querySelector('input[name="keep_me"]');
          if (keep && !keep.checked) keep.click();
        })()
        """
    )
    # Recaptcha is revealed after the first keyup; wait for the widget.
    token = ""
    for i in range(28):
        if cdp.eval("document.body && document.body.innerText.includes('We care about your privacy')"):
            dismiss_cookies(cdp)
            size = cdp.eval("[window.innerWidth, window.innerHeight]")
            if size:
                mouse_click(cdp, size[0] * 0.72, size[1] * 0.70)
                time.sleep(0.6)
        iframe = cdp.eval(
            """
            (() => {
              const iframe = document.querySelector('iframe[src*="recaptcha/anchor"], iframe[src*="recaptcha"]');
              if (!iframe) return {missing: true};
              const r = iframe.getBoundingClientRect();
              const x = r.x + 22, y = r.y + 22;
              const top = document.elementFromPoint(x, y);
              return {
                x, y, w: r.width, h: r.height,
                top: top ? (top.tagName + ' ' + (top.className || '').toString().slice(0,40)) : null
              };
            })()
            """
        )
        if i % 4 == 0:
            print("recaptcha", iframe)
        if iframe and iframe.get("w", 0) > 10:
            recaptcha_anchor_click()
            mouse_click(cdp, iframe["x"], iframe["y"])
            time.sleep(1.2)
            recaptcha_skip_or_verify()
        token = cdp.eval(
            "window.grecaptcha && grecaptcha.getResponse ? grecaptcha.getResponse() : ''"
        ) or ""
        if token:
            break
        if recaptcha_skip_or_verify() == "skip":
            time.sleep(1)
        time.sleep(0.6)
    if not token:
        print("recaptcha token missing")
        try:
            shot = cdp.call("Page.captureScreenshot", {"format": "png"})
            Path("/tmp/vvz-login-shot.png").write_bytes(__import__("base64").b64decode(shot["data"]))
            print("login screenshot /tmp/vvz-login-shot.png")
        except Exception:
            pass
        return False
    click_selector(cdp, "#btn-go") or cdp.eval("document.querySelector('form.prihlasenie')?.submit()")
    for _ in range(50):
        time.sleep(0.4)
        href = cdp.eval("location.href") or ""
        html = cdp.eval("document.body ? document.body.innerHTML.slice(0, 4000) : ''") or ""
        body = cdp.eval("document.body ? document.body.innerText.slice(0, 800) : ''") or ""
        if "security code was incorrect" in body.lower():
            print("login recaptcha rejected")
            break
        if "/profile/login" not in href and "login-pass" not in html:
            print("login ok", href.split("?")[0])
            return True
        if "Log out" in body or "Odhlásiť" in body or "My profile" in body:
            print("login ok", href.split("?")[0])
            return True
    try:
        shot = cdp.call("Page.captureScreenshot", {"format": "png"})
        Path("/tmp/vvz-login-shot.png").write_bytes(__import__("base64").b64decode(shot["data"]))
        print("login screenshot /tmp/vvz-login-shot.png")
    except Exception as exc:
        print("login screenshot fail", type(exc).__name__)
    print("login failed", (cdp.eval("location.href") or "").split("?")[0])
    return False


def cookies_for_urllib(cdp: Cdp):
    jar = __import__("http.cookiejar").cookiejar.CookieJar()
    result = cdp.call("Network.getAllCookies")
    for c in result.get("cookies") or []:
        cookie = __import__("http.cookiejar").cookiejar.Cookie(
            version=0,
            name=c["name"],
            value=c["value"],
            port=None,
            port_specified=False,
            domain=c.get("domain") or "",
            domain_specified=True,
            domain_initial_dot=(c.get("domain") or "").startswith("."),
            path=c.get("path") or "/",
            path_specified=True,
            secure=bool(c.get("secure")),
            expires=None,
            discard=True,
            comment=None,
            comment_url=None,
            rest={"HttpOnly": c.get("httpOnly")},
            rfc2109=False,
        )
        jar.set_cookie(cookie)
    return jar


def attach_dwg(row: dict, docs: list[dict], op) -> int:
    added = 0
    slug = row["slug"]
    existing_hrefs = {d.get("href") for d in row.get("documents") or []}
    for doc in docs:
        meta = imp.classify_doc(doc["title"], doc["href"], doc["locked"])
        if not meta or meta["kind"] != "cad":
            continue
        href = doc.get("href") or ""
        if not href:
            continue
        original = imp.basename(href)
        dest = DOC_ROOT / "dwg" / imp.safe_name(original)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.stat().st_size == 0:
            try:
                imp.fetch(op, href, dest)
            except Exception as exc:
                print("  dwg fail", row.get("sku"), exc)
                continue
        public_href = "/docs/vvz-play/" + str(dest.relative_to(DOC_ROOT)).replace("\\", "/")
        if public_href in existing_hrefs:
            continue
        entry = {
            "title": meta["title"],
            "typeLabel": meta["typeLabel"],
            "format": meta["format"],
            "href": public_href,
            "kind": meta["kind"],
            "previewable": False,
            "originalName": original,
            "sourceUrl": href,
            "fetchedAt": FETCHED_AT,
            "access": "registered_customer",
            "appliesTo": "DWG. Kund laddar ner efter inloggning på STADORA.",
        }
        row.setdefault("documents", []).append(entry)
        existing_hrefs.add(public_href)
        added += 1
    row["gaps"] = [g for g in (row.get("gaps") or []) if "DWG" not in g]
    if not any(d.get("kind") == "cad" for d in row.get("documents") or []):
        row.setdefault("gaps", []).append("DWG saknas eller kräver fortfarande leverantörsinloggning.")
    return added


def main() -> int:
    user = (os.environ.get("VVZ_USER") or "").strip()
    password = os.environ.get("VVZ_PASSWORD") or ""
    if not user or not password:
        print("VVZ_USER / VVZ_PASSWORD not set — DWG stays locked.", file=sys.stderr)
        return 1
    if not SERIES_PATH.exists():
        print("missing", SERIES_PATH)
        return 1
    payload = json.loads(SERIES_PATH.read_text())
    chrome = start_chrome()
    kill = True
    try:
        wait_port(DEBUG_PORT)
        cdp = Cdp(page_ws())
        cdp.call("Network.enable")
        if not login(cdp):
            kill = False
            print("chrome kept for captcha on port", DEBUG_PORT)
            return 2
        jar = cookies_for_urllib(cdp)
        op = imp.opener(jar)
        added_total = 0
        for i, row in enumerate(payload.get("series") or [], 1):
            url = row.get("sourceUrl") or ""
            if not url:
                continue
            print(f"[{i}/{len(payload['series'])}] DWG {row.get('sku')}")
            try:
                html = imp.fetch(op, url).decode("utf-8", "replace")
            except Exception as exc:
                print("  page fail", exc)
                continue
            parsed = imp.parse_product_html(html, url)
            n = attach_dwg(row, parsed["docs"], op)
            added_total += n
            if n:
                print("  +", n, "dwg")
        SERIES_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        print("attached dwg files", added_total)
        return 0
    finally:
        if kill:
            chrome.terminate()
            try:
                chrome.wait(timeout=8)
            except subprocess.TimeoutExpired:
                chrome.kill()
        # Never keep a Chrome profile that may have stored supplier credentials.
        try:
            import shutil

            shutil.rmtree(PROFILE, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
