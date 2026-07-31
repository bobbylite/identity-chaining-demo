import type { CSSProperties } from 'react'
import { AGENT, AGENT_PROMPT, APPS, APP_ORDER, USER, type AppId } from '../data/world'
import { PROFILE_META, type Profile } from '../data/protocol'

interface Props {
  profile: Profile
  onPick: (app: AppId) => void
}

export default function Hero({ profile, onPick }: Props) {
  const meta = PROFILE_META[profile]

  return (
    <section className="hero wrap" id="top">
      <div className="hero-grid">
        <div>
          <div className="chips" style={{ marginBottom: 18 }}>
            <span className="chip chip-accent">Interactive · no backend</span>
            <span className="chip">Every token decoded in your browser</span>
          </div>

          <h1>
            An AI agent needs your data.
            <br />
            It lives in <em>somebody else’s</em> trust domain.
          </h1>

          <p className="hero-lede">
            {USER.name} asks one question. Answering it means reaching into four SaaS
            products that have never heard of {AGENT.name}, on behalf of a person none of
            them can see. <strong>No API keys. No consent pop-ups. No service account.</strong>{' '}
            This page walks the whole chain — every request, every claim, every rejection —
            and lets you break it on purpose to see which party catches what.
          </p>

          <div className="hero-cta">
            <a className="btn btn-primary" href="#walkthrough">
              Run the chain →
            </a>
            <a className="btn" href="#lab">
              Try to break it
            </a>
          </div>

          <div className="chips">
            <a className="chip" href={meta.spec.href} target="_blank" rel="noreferrer">
              {meta.spec.label} ↗
            </a>
            <span className="chip">RFC 8693 · Token Exchange</span>
            <span className="chip">RFC 7523 · JWT Bearer</span>
            <span className="chip">RFC 9728 · Resource Metadata</span>
            <span className="chip">MCP Authorization</span>
          </div>
        </div>

        <div className="prompt-card">
          <div className="prompt-head">
            <span className="dot" aria-hidden />
            {AGENT.longName}
          </div>
          <div className="prompt-body">
            <div className="bubble bubble-user">
              <div className="bubble-who">{USER.name}</div>
              {AGENT_PROMPT}
            </div>

            <div className="bubble">
              <div className="bubble-who">{AGENT.name}</div>
              <p style={{ marginBottom: 10 }}>
                That needs four tools, in four separate trust domains. Here is what I have to
                get through first:
              </p>
              <div className="fanout">
                {APP_ORDER.map((id) => {
                  const app = APPS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className="fanout-row"
                      onClick={() => onPick(id)}
                      style={
                        {
                          '--tone': `var(--app-${app.hue})`,
                          '--tone-soft': `var(--app-${app.hue}-soft)`,
                        } as CSSProperties
                      }
                    >
                      <span className="app-mark" aria-hidden>
                        {app.mark}
                      </span>
                      <span>
                        <b>{app.name}</b> {app.because}
                      </span>
                      <span className="tag">{app.scope}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
