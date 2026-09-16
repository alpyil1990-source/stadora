import { useTheme, type VisualTheme } from '../context/ThemeContext'

const options: { id: VisualTheme; label: string }[] = [
  { id: 'atelje', label: 'Ateljé' },
  { id: 'atlas', label: 'Atlas' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="Visuellt uttryck">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em]">Uttryck</span>
      <div className="inline-flex border border-current">
        {options.map((opt) => {
          const on = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={on}
              onClick={() => setTheme(opt.id)}
              className={`min-h-7 px-2.5 text-xs ${
                on ? (theme === 'atelje' ? 'bg-ink text-paper' : 'bg-sheet text-ink') : 'bg-transparent'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
