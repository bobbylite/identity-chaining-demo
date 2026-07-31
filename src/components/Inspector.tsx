import { useEffect, useState } from 'react'
import type { Run, Step } from '../data/protocol'
import HttpView from './HttpView'
import JwtView from './JwtView'

type Tab = 'http' | 'tokens'

interface Props {
  run: Run
  step: Step
}

export default function Inspector({ run, step }: Props) {
  const [tab, setTab] = useState<Tab>('tokens')

  // Steps differ in what they have to show: the first one puts nothing on the wire,
  // and some later ones carry no token. Land on whichever tab has content.
  useEffect(() => {
    if (tab === 'tokens' && step.tokens.length === 0) setTab('http')
    else if (tab === 'http' && !step.request && !step.response && step.tokens.length > 0)
      setTab('tokens')
  }, [step, tab])

  const verdict = (() => {
    if (step.status === 'failed' && run.failure) {
      return (
        <div className="verdict verdict-bad">
          <div className="verdict-head">
            <span aria-hidden>✕</span>
            Rejected by {run.failure.enforcedByLabel}
            <span className={`lab-who ${run.failure.enforcedBy}`}>{run.failure.control}</span>
          </div>
          <p>
            <code>{run.failure.error}</code> — {run.failure.description}
          </p>
          <p>{run.failure.lesson}</p>
        </div>
      )
    }
    if (step.status === 'blocked') {
      return (
        <div className="verdict">
          <div className="verdict-head" style={{ color: 'var(--ink-3)' }}>
            <span aria-hidden>—</span>
            Never reached
          </div>
          <p>The chain already broke at step {run.failure?.step}. This step does not happen.</p>
        </div>
      )
    }
    if (step.n === run.steps.length && run.ok) {
      return (
        <div className="verdict verdict-ok">
          <div className="verdict-head">
            <span aria-hidden>✓</span>
            {run.app.name} answered
          </div>
          <p>{run.app.result}</p>
          <p>
            Its audit log records the agent as the actor and {run.app.name} still sees a
            named user as the subject — not a shared integration account.
          </p>
        </div>
      )
    }
    return null
  })()

  return (
    <div className="insp">
      <div className="insp-left">
        <div className="fade-in" key={`${run.app.id}-${run.profile}-${run.condition}-${step.n}`}>
          <h3 className="insp-step-title">{step.title}</h3>
          <p className="insp-narrative">{step.narrative}</p>

          <blockquote className="spec-quote">
            <p>“{step.spec.quote}”</p>
            <a href={step.spec.href} target="_blank" rel="noreferrer">
              {step.spec.label} ↗
            </a>
          </blockquote>

          {verdict}
        </div>
      </div>

      <div className="insp-right">
        <div className="tabs" role="tablist" aria-label="Step detail">
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'http'}
            onClick={() => setTab('http')}
          >
            On the wire
          </button>
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'tokens'}
            disabled={step.tokens.length === 0}
            onClick={() => setTab('tokens')}
          >
            Tokens{step.tokens.length ? ` (${step.tokens.length})` : ''}
          </button>
        </div>

        <div className="tab-body">
          {tab === 'http' ? (
            <HttpView request={step.request} response={step.response} />
          ) : (
            <JwtView tokens={step.tokens} />
          )}
        </div>
      </div>
    </div>
  )
}
