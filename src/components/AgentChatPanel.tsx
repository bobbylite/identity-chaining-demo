import { motion, AnimatePresence } from 'framer-motion'
import { STEPS, TOOLS, USER } from '../data/scenario'

const sfStart = STEPS.findIndex((s) => s.phase === 'salesforce')
const sfEnd = STEPS.findIndex((s) => s.phase === 'salesforce' && s.phaseStep === 6)
const snStart = STEPS.findIndex((s) => s.phase === 'servicenow')
const snEnd = STEPS.findIndex((s) => s.phase === 'servicenow' && s.phaseStep === 6)

function ToolCallBubble({
  phase,
  started,
  done,
}: {
  phase: 'salesforce' | 'servicenow'
  started: boolean
  done: boolean
}) {
  if (!started) return null
  const tool = TOOLS[phase]
  return (
    <motion.div
      className="chat-msg chat-msg-tool"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderColor: tool.color }}
    >
      <div className="chat-tool-head">
        <span className="chat-tool-dot" style={{ background: tool.color }} />
        MCP tool call · {tool.name}
      </div>
      <code className="chat-tool-call">{tool.mcpCall}</code>
      {!done ? (
        <div className="chat-tool-status">
          <span className="chat-spinner" style={{ borderTopColor: tool.color }} />
          chaining identity into {tool.name}…
        </div>
      ) : (
        <motion.div
          className="chat-tool-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          ✓ {tool.mcpResultSummary}
        </motion.div>
      )}
    </motion.div>
  )
}

export default function AgentChatPanel({ currentIndex }: { currentIndex: number }) {
  const sfStarted = currentIndex >= sfStart
  const sfDone = currentIndex >= sfEnd
  const snStarted = currentIndex >= snStart
  const snDone = currentIndex >= snEnd
  const allDone = currentIndex >= STEPS.length - 1

  return (
    <div className="chat-panel">
      <div className="chat-panel-head">Agent conversation</div>
      <div className="chat-scroll">
        <motion.div className="chat-msg chat-msg-user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="chat-author">{USER.name}</div>
          Can you check on the Acme Corp renewal and clear whatever's blocking it? File a ticket if something's stuck.
        </motion.div>

        <motion.div
          className="chat-msg chat-msg-agent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="chat-author">Nova (Agent)</div>
          On it — I'll need to look this up in Salesforce, then open a ServiceNow incident if there's a blocker. Since these
          are two different trust domains, I'll chain your identity into each one first.
        </motion.div>

        <AnimatePresence>
          <ToolCallBubble key="sf" phase="salesforce" started={sfStarted} done={sfDone} />
          <ToolCallBubble key="sn" phase="servicenow" started={snStarted} done={snDone} />
        </AnimatePresence>

        {allDone && (
          <motion.div
            className="chat-msg chat-msg-agent chat-msg-final"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="chat-author">Nova (Agent)</div>
            Done. The Acme Corp renewal was blocked on an open issue, so I filed{' '}
            <strong>INC0010234</strong> in ServiceNow and linked it to the Salesforce opportunity. Both actions are
            attributed to you, {USER.name.split(' ')[0]} — every tool call carried your identity, chained across trust
            domains per RFC 8693 + RFC 7523.
          </motion.div>
        )}
      </div>
    </div>
  )
}
