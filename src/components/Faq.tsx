import { useState } from 'react'
import { FAQ } from '../data/story'

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Loose ends</div>
          <h2>The questions this always raises</h2>
        </div>

        <div className="faq">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div className="faq-item" key={item.q}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {item.q}
                  <span className="faq-sign" aria-hidden>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && <p className="faq-a fade-in">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
