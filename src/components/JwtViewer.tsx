import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { decodeJwt } from '../data/tokens'

const CLAIM_INFO: Record<string, string> = {
  alg: 'Signing algorithm the issuer used for this token.',
  typ: 'Token type — always JWT here.',
  kid: "Key ID — tells a verifier which of the issuer's public keys to check the signature against.",
  iss: 'Issuer — the authorization server that minted and signed this token.',
  sub: "Subject — the human this token is ultimately about. Preserved unchanged across every hop in the chain, so downstream services always know who's really behind the request.",
  aud: 'Audience — the single party this token may be presented to. Restricting this to one recipient stops it from being replayed against a different trust domain.',
  act: "Actor claim (RFC 8693 §4.1) — identifies the party acting on the subject's behalf. This is what lets a resource server see both who the human is AND which agent/client is making the call for them.",
  scope: 'The permissions granted — kept as narrow as the task actually needs.',
  client_id: 'The OAuth client that originally authenticated the user, before any chaining happened.',
  iat: 'Issued-at time (Unix seconds).',
  exp: 'Expiry time (Unix seconds) — chained grants are intentionally short-lived to limit their blast radius.',
  jti: 'Unique token identifier — useful for replay detection and audit trails.',
}

function relTime(unix: number): string {
  const diff = unix - Math.floor(Date.now() / 1000)
  if (Math.abs(diff) < 2) return 'now'
  const abs = Math.abs(diff)
  const unit = abs >= 3600 ? [Math.round(abs / 3600), 'hr'] : abs >= 60 ? [Math.round(abs / 60), 'min'] : [abs, 's']
  return diff > 0 ? `in ${unit[0]}${unit[1]}` : `${unit[0]}${unit[1]} ago`
}

function ClaimRow({ k, v, expanded, onToggle }: { k: string; v: unknown; expanded: boolean; onToggle: () => void }) {
  const info = CLAIM_INFO[k]
  let display: string
  if (k === 'act' && v && typeof v === 'object') {
    const a = v as { sub?: string; iss?: string }
    display = `{ sub: "${a.sub}", iss: "${a.iss}" }`
  } else if ((k === 'iat' || k === 'exp') && typeof v === 'number') {
    display = `${v}  (${relTime(v)})`
  } else {
    display = JSON.stringify(v)
  }
  return (
    <div className={`claim-row${info ? ' claim-row-clickable' : ''}`} onClick={info ? onToggle : undefined}>
      <div className="claim-row-main">
        <span className="claim-key">{k}</span>
        <span className="claim-value">{display}</span>
      </div>
      <AnimatePresence>
        {expanded && info && (
          <motion.div
            className="claim-info"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {info}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function JwtViewer({ label, value }: { label: string; value: string }) {
  const decoded = useMemo(() => decodeJwt(value), [value])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="jwt-viewer">
      <div className="jwt-viewer-head">
        <span>{label}</span>
        <button className="jwt-copy-btn" onClick={copy} type="button">
          {copied ? 'Copied ✓' : 'Copy token'}
        </button>
      </div>

      <div className="jwt-raw">
        <span className="jwt-seg jwt-seg-header">{decoded.raw.header}</span>.
        <span className="jwt-seg jwt-seg-payload">{decoded.raw.payload}</span>.
        <span className="jwt-seg jwt-seg-sig">{decoded.raw.signature}</span>
      </div>

      <div className="jwt-sim-badge">Simulated token — structurally a real JWT, signature is inert demo data</div>

      <div className="jwt-columns">
        <div className="jwt-column">
          <div className="jwt-column-title jwt-seg-header-text">Header</div>
          {Object.entries(decoded.header).map(([k, v]) => (
            <ClaimRow key={k} k={k} v={v} expanded={expanded === 'h-' + k} onToggle={() => setExpanded(expanded === 'h-' + k ? null : 'h-' + k)} />
          ))}
        </div>
        <div className="jwt-column">
          <div className="jwt-column-title jwt-seg-payload-text">Payload</div>
          {Object.entries(decoded.payload).map(([k, v]) => (
            <ClaimRow key={k} k={k} v={v} expanded={expanded === 'p-' + k} onToggle={() => setExpanded(expanded === 'p-' + k ? null : 'p-' + k)} />
          ))}
        </div>
      </div>
    </div>
  )
}
