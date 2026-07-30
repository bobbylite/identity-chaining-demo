import { motion, AnimatePresence } from 'framer-motion'
import type { StepDef } from '../data/scenario'

const FIGURE_1 = `+-------------+         +--------+         +-------------+ +---------+
|Authorization|         | Client |         |Authorization| |Protected|
|Server       |         | Trust  |         |Server       | |Resource |
|Trust        |         |Domain A|         |Trust        | |Trust    |
|Domain A     |         |        |         |Domain B     | |Domain B |
+-------------+         +--------+         +-------------+ +---------+
       |                    |                     |             |
       |                    |----+                |             |
       |      (1) discover  |    |                |             |
       |      Authorization |<---+                |             |
       |      Server        |                     |             |
       |      Trust Domain B|                     |             |
       |                    |                     |             |
       | (2) exchange token |                     |             |
       |   [RFC8693]        |                     |             |
       |<-------------------|                     |             |
       |                    |                     |             |
       | (3) <authorization |                     |             |
       |       grant JWT>   |                     |             |
       | - - - - - - - - - >|                     |             |
       |                    |                     |             |
       |                    | (4) present         |             |
       |                    | authorization grant |             |
       |                    | [RFC7523]           |             |
       |                    | ------------------->|             |
       |                    |                     |             |
       |                    | (5) <access token>  |             |
       |                    | <- - - - - - - - - -|             |
       |                    |                     |             |
       |                    |               (6) access          |
       |                    | --------------------------------->|
       |                    |                     |             |`

export default function SpecCompare({ open, step, onClose }: { open: boolean; step: StepDef; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Mapped to the spec — Figure 1</h3>
              <button className="modal-close" onClick={onClose} type="button">
                ✕
              </button>
            </div>
            <p className="modal-sub">
              You're currently on <strong>step {step.phaseStep}</strong> of the six-step flow, applied to {step.phase === 'salesforce' ? 'Salesforce' : 'ServiceNow'} as Trust Domain B.
            </p>
            <pre className="modal-ascii">{FIGURE_1}</pre>
            <blockquote className="narration-quote">
              “{step.specQuote}”
              <cite>— draft-ietf-oauth-identity-chaining, Figure 1</cite>
            </blockquote>
            <a className="modal-link" href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/" target="_blank" rel="noreferrer">
              Read the full draft on IETF Datatracker ↗
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
