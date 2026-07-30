import { motion, AnimatePresence } from 'framer-motion'
import type { StepDef } from '../data/scenario'

function BodyBlock({ body }: { body: string }) {
  if (body.trim().startsWith('{')) {
    return <pre className="net-body net-json">{body}</pre>
  }
  if (body.includes('\n&')) {
    const [first, ...rest] = body.split('\n&')
    return (
      <pre className="net-body net-form">
        {first}
        {rest.map((line, i) => (
          <span key={i}>
            {'\n&'}
            {line}
          </span>
        ))}
      </pre>
    )
  }
  return <pre className="net-body">{body}</pre>
}

export default function NetworkPanel({ step }: { step: StepDef }) {
  if (!step.request && !step.response) return null
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        className="net-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {step.request && (
          <div className="net-block">
            <div className="net-block-head">
              <span className="net-method">{step.request.method}</span>
              <span className="net-url">{step.request.url}</span>
            </div>
            {step.request.headers?.map(([k, v]) => (
              <div className="net-header" key={k}>
                <span className="net-header-key">{k}:</span> {v}
              </div>
            ))}
            {step.request.body && <BodyBlock body={step.request.body} />}
          </div>
        )}
        {step.response && (
          <div className="net-block net-block-response">
            <div className="net-block-head">
              <span className="net-status">{step.response.status}</span>
            </div>
            {step.response.headers?.map(([k, v]) => (
              <div className="net-header" key={k}>
                <span className="net-header-key">{k}:</span> {v}
              </div>
            ))}
            {step.response.body && <BodyBlock body={step.response.body} />}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
