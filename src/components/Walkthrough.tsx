import type { CSSProperties } from 'react'
import { APPS, APP_ORDER, AGENT, IDP, type AppId } from '../data/world'
import {
  CONDITIONS,
  PROFILE_META,
  type Condition,
  type Policy,
  type Profile,
  type Run,
} from '../data/protocol'
import FlowMap from './FlowMap'
import Inspector from './Inspector'

interface Props {
  run: Run
  appId: AppId
  onApp: (id: AppId) => void
  profile: Profile
  onProfile: (p: Profile) => void
  condition: Condition
  onCondition: (c: Condition) => void
  policy: Policy
  onPolicy: (id: AppId, allowed: boolean) => void
  index: number
  onIndex: (i: number) => void
  playing: boolean
  onPlay: () => void
  speed: number
  onSpeed: (ms: number) => void
}

export default function Walkthrough(props: Props) {
  const {
    run,
    appId,
    onApp,
    profile,
    onProfile,
    condition,
    onCondition,
    policy,
    onPolicy,
    index,
    onIndex,
    playing,
    onPlay,
    speed,
    onSpeed,
  } = props

  const step = run.steps[index]
  const atEnd = index >= run.steps.length - 1

  return (
    <section className="section" id="walkthrough">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">The walkthrough</div>
          <h2>One tool call, five steps, two trust domains</h2>
          <p>
            Pick an app, step through the chain, and click anything monospaced — request
            parameters and JWT claims both explain themselves. Switch the profile to compare{' '}
            <strong>{PROFILE_META.chaining.name}</strong> with{' '}
            <strong>{PROFILE_META.xaa.name}</strong> on the identical scenario.
          </p>
        </div>

        <div className="console">
          {/* ------------------------------------------------ sidebar --- */}
          <div className="side">
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Tools the agent needs</span>
              </div>
              <div className="rail">
                {APP_ORDER.map((id) => {
                  const app = APPS[id]
                  const allowed = policy[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className="app-btn"
                      aria-current={id === appId}
                      onClick={() => onApp(id)}
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
                      <span className="app-meta">
                        <span className="app-name">{app.name}</span>
                        <span className="app-sub">{app.kind} · {app.domain}</span>
                      </span>
                      <span className={`app-state ${allowed ? 'on' : 'off'}`}>
                        {allowed ? 'linked' : 'blocked'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="rail-note">
                Each app is a separate trust domain with its own authorization server. The
                agent holds no credential for any of them.
              </p>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">{IDP.name} · admin console</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                  Which apps {AGENT.name} may act in, on a user’s behalf. This is the only
                  place the decision is made.
                </p>
                {APP_ORDER.map((id) => (
                  <div className="switch-row" key={id}>
                    <span>{APPS[id].name}</span>
                    <button
                      type="button"
                      className="switch"
                      aria-pressed={policy[id]}
                      aria-label={`${APPS[id].name} assignment`}
                      onClick={() => onPolicy(id, !policy[id])}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------- main --- */}
          <div className="panel">
            <div className="transport">
              <div className="seg seg-accent" role="group" aria-label="Protocol profile">
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

              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                className="tsel"
                value={condition}
                onChange={(e) => onCondition(e.target.value as Condition)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="transport-spacer" />

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onIndex(Math.max(0, index - 1))}
                disabled={index === 0}
              >
                ← Prev
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onPlay}>
                {playing ? '❚❚ Pause' : atEnd ? '↻ Replay' : '▶ Play'}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onIndex(Math.min(run.steps.length - 1, index + 1))}
                disabled={atEnd}
              >
                Next →
              </button>
              <select
                className="tsel"
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => onSpeed(Number(e.target.value))}
              >
                <option value={4200}>0.5×</option>
                <option value={2600}>1×</option>
                <option value={1500}>2×</option>
              </select>
              <span className="kbd opt">← → space</span>
            </div>

            <div className="steps" role="tablist" aria-label="Protocol steps">
              {run.steps.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  className={`step-btn is-${s.status}`}
                  aria-current={i === index}
                  aria-selected={i === index}
                  onClick={() => onIndex(i)}
                >
                  <span className="step-n">
                    <span className={`pip pip-${s.status}`} aria-hidden />
                    Step {s.n} · {s.short}
                  </span>
                  <span className="step-title">{s.title}</span>
                </button>
              ))}
            </div>

            <FlowMap run={run} step={step} />

            <Inspector run={run} step={step} />
          </div>
        </div>
      </div>
    </section>
  )
}
