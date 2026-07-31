import { useState } from 'react'
import { CONTRASTS } from '../data/story'

export default function Contrasts() {
  const [active, setActive] = useState(CONTRASTS[0].id)
  const item = CONTRASTS.find((c) => c.id === active) ?? CONTRASTS[0]

  return (
    <section className="section" id="why">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">The problem</div>
          <h2>Five questions that decide whether agents are safe to deploy</h2>
          <p>
            None of them are about the model. They are all about what happens when software
            has to act for a person somewhere it does not belong. Pick one.
          </p>
        </div>

        <div className="contrast-tabs" role="tablist" aria-label="Comparison topics">
          {CONTRASTS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === active}
              className="contrast-tab"
              onClick={() => setActive(c.id)}
            >
              {c.question}
            </button>
          ))}
        </div>

        <div className="contrast-pair fade-in" key={item.id}>
          <div className="contrast-card contrast-bad">
            <h3>Without cross-domain access</h3>
            <p>{item.without}</p>
          </div>
          <div className="contrast-card contrast-good">
            <h3>With it</h3>
            <p>{item.with}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
