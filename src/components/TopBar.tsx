import type { ThemeChoice } from '../lib/useTheme'
import { PROFILE_META, type Profile } from '../data/protocol'

interface Props {
  profile: Profile
  onProfile: (p: Profile) => void
  theme: ThemeChoice
  onTheme: (t: ThemeChoice) => void
}

const THEMES: { id: ThemeChoice; label: string; glyph: string }[] = [
  { id: 'light', label: 'Light', glyph: '☀' },
  { id: 'dark', label: 'Dark', glyph: '☾' },
  { id: 'system', label: 'System', glyph: '◐' },
]

export default function TopBar({ profile, onProfile, theme, onTheme }: Props) {
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <a className="brand" href="#top" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-mark" aria-hidden>
            ⇄
          </span>
          <span className="brand-text">Cross-domain access, live</span>
        </a>

        <div className="topbar-spacer" />

        <div className="seg seg-accent opt" role="group" aria-label="Protocol profile">
          {(Object.keys(PROFILE_META) as Profile[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={profile === p}
              onClick={() => onProfile(p)}
              title={PROFILE_META[p].blurb}
            >
              {PROFILE_META[p].name}
            </button>
          ))}
        </div>

        <nav className="topbar-links">
          <a className="tlink opt" href="#walkthrough">
            Walkthrough
          </a>
          <a className="tlink opt" href="#lab">
            Break it
          </a>
          <a className="tlink opt" href="#faq">
            FAQ
          </a>
        </nav>

        <div className="seg seg-icon" role="group" aria-label="Colour theme">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => onTheme(t.id)}
              title={`${t.label} theme`}
            >
              <span aria-hidden>{t.glyph}</span>
              <span className="sr-only">{t.label} theme</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
