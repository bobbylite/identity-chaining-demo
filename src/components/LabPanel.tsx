import { CONDITIONS, type Condition, type Run } from '../data/protocol'
import { IDP } from '../data/world'

interface Props {
  condition: Condition
  onCondition: (c: Condition) => void
  run: Run
}

export default function LabPanel({ condition, onCondition, run }: Props) {
  return (
    <section className="section" id="lab">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">The security lab</div>
          <h2>Now break it on purpose</h2>
          <p>
            Pick a failure and the walkthrough above rebuilds around it — different request
            bodies, different error responses, and the chain stops at whichever party is
            actually responsible for catching that mistake. Two of these die at{' '}
            {IDP.name}. Three of them die on the other side of the trust boundary.
          </p>
        </div>

        <div className="lab-grid">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="lab-btn"
              aria-pressed={condition === c.id}
              onClick={() => {
                onCondition(c.id)
                document.getElementById('walkthrough')?.scrollIntoView({ block: 'start' })
              }}
            >
              <span className="lab-name">
                {c.name}
                {c.caughtBy && (
                  <span className={`lab-who ${c.caughtBy}`}>
                    {c.caughtBy === 'idp' ? 'caught by IdP' : 'caught by app'}
                  </span>
                )}
              </span>
              <span className="lab-blurb">{c.blurb}</span>
            </button>
          ))}
        </div>

        {run.failure && (
          <div className="verdict verdict-bad fade-in" style={{ marginTop: 18 }}>
            <div className="verdict-head">
              <span aria-hidden>✕</span>
              Currently failing at step {run.failure.step} · {run.failure.enforcedByLabel}
              <span className={`lab-who ${run.failure.enforcedBy}`}>{run.failure.control}</span>
            </div>
            <p>{run.failure.lesson}</p>
          </div>
        )}

        {!run.failure && (
          <div className="verdict verdict-ok fade-in" style={{ marginTop: 18 }}>
            <div className="verdict-head">
              <span aria-hidden>✓</span>
              Clean run — the chain completes against {run.app.name}
            </div>
            <p>
              Pick any card above to sabotage it. Note that nothing you can do from the
              agent’s side produces a token it was not entitled to: the worst outcome
              available is a rejection.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
