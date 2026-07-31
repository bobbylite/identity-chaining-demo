import { useState } from 'react'
import type { TokenRef } from '../data/protocol'
import { decodeJwt, signatureIsValid } from '../data/tokens'
import { CLAIMS } from '../data/glossary'

const TIME_CLAIMS = new Set(['iat', 'exp', 'nbf', 'auth_time'])

function renderValue(name: string, value: unknown): string {
  if (TIME_CLAIMS.has(name) && typeof value === 'number') {
    const delta = value - Math.floor(Date.now() / 1000)
    const mins = Math.round(Math.abs(delta) / 60)
    const rel =
      Math.abs(delta) < 45
        ? 'now'
        : delta > 0
          ? `in ${mins} min`
          : `${mins} min ago`
    return `${value}   // ${rel}`
  }
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

function Claims({
  title,
  entries,
  emphasise,
}: {
  title: string
  entries: [string, unknown][]
  emphasise: boolean
}) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="claims" style={{ marginTop: 10 }}>
      <div className="claims-head">{title}</div>
      {entries.map(([k, v]) => {
        const entry = CLAIMS[k]
        const active = open === k
        return (
          <div key={k}>
            <button
              type="button"
              className={`claim${emphasise && entry?.key ? ' is-key' : ''}`}
              onClick={() => entry && setOpen(active ? null : k)}
              aria-expanded={entry ? active : undefined}
            >
              <span className="claim-name">{k}</span>: {renderValue(k, v)}
              {emphasise && entry?.key && <span className="claim-hint">load-bearing</span>}
            </button>
            {entry && active && (
              <div className="claim-explain fade-in">
                <b>{entry.term}</b>
                {entry.text}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function One({ token }: { token: TokenRef }) {
  const decoded = decodeJwt(token.value)
  const intact = signatureIsValid(token.value)

  return (
    <div className="jwt">
      <div className="jwt-head">
        <span className="jwt-label">{token.label}</span>
        <span className={`jwt-role ${token.role}`}>{token.role}</span>
      </div>
      <p className="jwt-note">{token.note}</p>

      <div className="jwt-raw">
        <span className="seg-h">{decoded.raw.header}</span>
        <span style={{ color: 'var(--ink-3)' }}>.</span>
        <span className="seg-p">{decoded.raw.payload}</span>
        <span style={{ color: 'var(--ink-3)' }}>.</span>
        <span className="seg-s">{decoded.raw.signature}</span>
      </div>

      <Claims
        title="Header"
        entries={Object.entries(decoded.header) as [string, unknown][]}
        emphasise={false}
      />
      <Claims title="Payload — click a claim" entries={Object.entries(decoded.payload)} emphasise />

      <div className={`sig-note${intact ? '' : ' bad'}`}>
        {intact
          ? 'Signature segment matches this payload. In production the receiver would verify it against the issuer’s published JWKS before trusting a single claim.'
          : 'Signature no longer matches this payload — the claims were edited after signing. Every conformant authorization server rejects this outright.'}
      </div>
    </div>
  )
}

export default function JwtView({ tokens }: { tokens: TokenRef[] }) {
  if (tokens.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
        No token is in play at this step.
      </p>
    )
  }
  return (
    <div className="fade-in">
      {tokens.map((t) => (
        <One key={t.id + t.value.slice(-6)} token={t} />
      ))}
    </div>
  )
}
