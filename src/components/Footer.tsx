import { SPECS } from '../data/protocol'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-links">
          {Object.values(SPECS).map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer">
              {s.label} ↗
            </a>
          ))}
        </div>
        <p>
          <strong style={{ color: 'var(--ink-2)' }}>Everything here is simulated.</strong> No
          request leaves this page, no backend exists, and every JWT is generated in your
          browser with an inert placeholder where the signature belongs. The header and
          payload really are base64url, so they decode exactly like the real thing — but
          nothing is signed and nothing is verified.
        </p>
        <p>
          Company names, domains and data are fictional; every hostname uses the reserved{' '}
          <code>.example</code> TLD. Built as a static page — no analytics, no cookies, no
          network calls.
        </p>
      </div>
    </footer>
  )
}
