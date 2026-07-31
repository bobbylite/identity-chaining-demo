import { useState } from 'react'
import type { Http } from '../data/protocol'
import { PARAMS } from '../data/glossary'
import { abbreviate } from '../data/tokens'

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true)
            setTimeout(() => setDone(false), 1400)
          },
          () => undefined,
        )
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

/** Long opaque values (JWTs) are truncated in the middle so the shape stays readable. */
function displayValue(value: string): string {
  if (value.length < 90) return value
  if (value.split('.').length === 3) return abbreviate(value, 10)
  return `${value.slice(0, 70)}…`
}

function Block({ http, kind }: { http: Http; kind: 'request' | 'response' }) {
  const [open, setOpen] = useState<string | null>(null)
  const isError = kind === 'response' && !!http.status && !http.status.startsWith('2')

  const raw =
    http.form?.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') ?? http.json ?? ''

  return (
    <div className="http">
      <div className="http-head">
        {http.method ? <span className="http-verb">{http.method}</span> : null}
        {http.url ? <span className="http-url">{http.url}</span> : null}
        {!http.method && !http.url ? (
          <span className="http-verb">{kind === 'response' ? 'RESPONSE' : 'REQUEST'}</span>
        ) : null}
        {http.status ? (
          <span className={`http-status${isError ? ' err' : ''}`}>{http.status}</span>
        ) : null}
      </div>

      {http.headers.length > 0 && (
        <div className="http-section">
          <div className="http-label">Headers</div>
          <div className="kv">
            {http.headers.map(([k, v]) => (
              <div key={k}>
                <b>{k}:</b> {v.length > 80 ? `${v.slice(0, 76)}…` : v}
              </div>
            ))}
          </div>
        </div>
      )}

      {http.form && (
        <div className="http-section">
          <div className="http-label">
            Body · form-encoded
            <CopyButton text={raw} />
          </div>
          {http.form.map(([k, v]) => {
            const entry = PARAMS[k]
            const active = open === k
            return (
              <div key={k}>
                <button
                  type="button"
                  className={`form-line${entry ? ' explainable' : ''}`}
                  onClick={() => entry && setOpen(active ? null : k)}
                  aria-expanded={entry ? active : undefined}
                >
                  <b>{k}</b>={displayValue(v)}
                </button>
                {entry && active && (
                  <div className="explain fade-in">
                    <b>{entry.term}</b>
                    {entry.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {http.json && (
        <div className="http-section">
          <div className="http-label">
            Body · JSON
            <CopyButton text={http.json} />
          </div>
          <pre className="code">{http.json}</pre>
        </div>
      )}
    </div>
  )
}

export default function HttpView({
  request,
  response,
}: {
  request?: Http
  response?: Http
}) {
  if (!request && !response) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
        Nothing goes over the wire at this step — the agent is only holding a token it was
        already given.
      </p>
    )
  }
  return (
    <div className="fade-in">
      {request && <Block http={request} kind="request" />}
      {response && <Block http={response} kind="response" />}
    </div>
  )
}
