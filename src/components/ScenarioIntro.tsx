import { motion } from 'framer-motion'

export default function ScenarioIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro">
      <div className="intro-bg" aria-hidden />
      <motion.div className="intro-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="intro-eyebrow">Interactive spec walkthrough</div>
        <h1 className="intro-title">
          Identity &amp; Authorization Chaining, <span className="intro-title-accent">live</span>
        </h1>
        <p className="intro-lede">
          A fully-simulated, click-through demo of <strong>Figure 1</strong> from{' '}
          <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/" target="_blank" rel="noreferrer">
            draft-ietf-oauth-identity-chaining
          </a>
          . Watch an AI agent chain a real user's identity — via RFC 8693 token exchange and an RFC 7523 JWT-bearer
          grant — across trust domains into two MCP tools: <strong style={{ color: '#00A1E0' }}>Salesforce</strong> and{' '}
          <strong style={{ color: '#62D84E' }}>ServiceNow</strong>. Every request, response, and JWT shown is generated
          and decoded live in your browser.
        </p>

        <div className="intro-badges">
          <span className="badge badge-rfc">RFC 8693 · Token Exchange</span>
          <span className="badge badge-rfc">RFC 7523 · JWT Bearer Grant</span>
          <span className="badge" style={{ background: '#00A1E022', color: '#00A1E0', borderColor: '#00A1E055' }}>
            Salesforce MCP tool
          </span>
          <span className="badge" style={{ background: '#62D84E22', color: '#62D84E', borderColor: '#62D84E55' }}>
            ServiceNow MCP tool
          </span>
        </div>

        <button className="intro-start-btn" onClick={onStart} type="button">
          Start the demo →
        </button>

        <p className="intro-fineprint">
          No backend. No real credentials. Every token, HTTP call, and API response on this page is fabricated for
          demonstration and clearly marked as simulated.
        </p>
      </motion.div>
    </div>
  )
}
