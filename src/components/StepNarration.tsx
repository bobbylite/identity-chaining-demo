import { motion, AnimatePresence } from 'framer-motion'
import type { StepDef, ToolMeta } from '../data/scenario'

export default function StepNarration({ step, tool }: { step: StepDef; tool: ToolMeta }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        className="narration"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <div className="narration-badges">
          <span className="badge" style={{ background: `${tool.color}22`, color: tool.color, borderColor: `${tool.color}55` }}>
            {tool.name} · step {step.phaseStep}/6
          </span>
          {step.rfc && <span className="badge badge-rfc">RFC {step.rfc}</span>}
        </div>
        <h2 className="narration-title">{step.title}</h2>
        <p className="narration-text">{step.narration}</p>
        <blockquote className="narration-quote">
          “{step.specQuote}”
          <cite>— draft-ietf-oauth-identity-chaining, Figure 1</cite>
        </blockquote>
      </motion.div>
    </AnimatePresence>
  )
}
