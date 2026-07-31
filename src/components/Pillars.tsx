import { PILLARS } from '../data/story'
import { PROFILE_META, type Profile } from '../data/protocol'

export default function Pillars({ profile }: { profile: Profile }) {
  const meta = PROFILE_META[profile]
  return (
    <section className="section" id="payoff">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">The payoff</div>
          <h2>What you actually bought</h2>
          <p>
            {meta.blurb} The six properties below are what fall out of it — and none of them
            required the agent, or any of the four SaaS vendors, to write bespoke trust code.
          </p>
        </div>

        <div className="pillars">
          {PILLARS.map((p, i) => (
            <div className="pillar" key={p.title}>
              <div className="pillar-n">{String(i + 1).padStart(2, '0')}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
