import { motion, AnimatePresence } from 'framer-motion'
import type { EntityId, StepDef, ToolMeta } from '../data/scenario'
import { AGENT_PLATFORM, USER } from '../data/scenario'

interface NodePos {
  id: EntityId
  x: number
  y: number
  w: number
  h: number
}

const NODES: NodePos[] = [
  { id: 'as-a', x: 90, y: 110, w: 190, h: 100 },
  { id: 'client', x: 380, y: 110, w: 190, h: 100 },
  { id: 'as-b', x: 670, y: 110, w: 190, h: 100 },
  { id: 'resource-b', x: 960, y: 110, w: 190, h: 100 },
]

const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<EntityId, NodePos>

function center(id: EntityId) {
  const n = nodeById[id]
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 }
}

export default function FlowDiagram({ step, tool }: { step: StepDef; tool: ToolMeta }) {
  const activeIds = new Set<EntityId>([step.edge.from, step.edge.to])

  const labels: Record<EntityId, { title: string; sub: string }> = {
    'as-a': { title: 'Authorization Server', sub: 'Trust Domain A · Agent Platform' },
    client: { title: 'AI Agent · MCP Client', sub: 'Trust Domain A' },
    'as-b': { title: tool.asLabel, sub: `Trust Domain B · ${tool.name}` },
    'resource-b': { title: tool.resourceLabel, sub: `Trust Domain B · ${tool.name}` },
  }

  const from = center(step.edge.from)
  const to = center(step.edge.to)

  return (
    <div className="diagram-wrap">
      <svg viewBox="0 0 1240 300" className="diagram-svg" role="img" aria-label="Identity chaining flow diagram">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
          <linearGradient id="domainA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(124,92,255,0.10)" />
            <stop offset="1" stopColor="rgba(124,92,255,0.02)" />
          </linearGradient>
          <linearGradient id="domainB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={`${tool.color}08`} />
            <stop offset="1" stopColor={`${tool.color}22`} />
          </linearGradient>
        </defs>

        {/* trust domain backdrops */}
        <rect x="40" y="40" width="580" height="220" rx="20" fill="url(#domainA)" stroke="rgba(124,92,255,0.35)" strokeDasharray="6 6" />
        <rect x="620" y="40" width="580" height="220" rx="20" fill="url(#domainB)" stroke={tool.color} strokeOpacity="0.4" strokeDasharray="6 6" />
        <text x="60" y="64" className="diagram-domain-label">TRUST DOMAIN A</text>
        <text x="1180" y="64" className="diagram-domain-label" textAnchor="end" style={{ fill: tool.color }}>
          TRUST DOMAIN B
        </text>
        <line x1="610" y1="30" x2="610" y2="280" stroke="var(--border)" strokeWidth="2" />

        {/* static connector lines (faint) */}
        {[
          ['as-a', 'client'],
          ['client', 'as-b'],
          ['as-b', 'resource-b'],
        ].map(([a, b]) => {
          const p1 = center(a as EntityId)
          const p2 = center(b as EntityId)
          return <line key={a + b} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--border)" strokeWidth="2" />
        })}

        {/* active edge */}
        <AnimatePresence mode="wait">
          <motion.g key={step.id}>
            <motion.line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={step.edge.kind === 'loop' ? 'var(--accent-2)' : 'var(--accent)'}
              strokeWidth={step.edge.kind === 'loop' ? 2 : 3}
              strokeDasharray={step.edge.kind === 'backward' ? '2 8' : step.edge.kind === 'loop' ? '3 6' : undefined}
              markerEnd="url(#arrow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <motion.circle
              r="7"
              fill={step.edge.kind === 'loop' ? 'var(--accent-2)' : 'var(--accent)'}
              initial={{ cx: from.x, cy: from.y, opacity: 0 }}
              animate={
                step.edge.kind === 'loop'
                  ? { cx: [from.x, to.x, from.x], cy: [from.y, to.y, from.y], opacity: [0, 1, 1, 0] }
                  : { cx: [from.x, to.x], cy: [from.y, to.y], opacity: [0, 1, 1, 0] }
              }
              transition={{ duration: step.edge.kind === 'loop' ? 1.6 : 1.1, ease: 'easeInOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${step.edge.kind === 'loop' ? 'var(--accent-2)' : 'var(--accent)'})` }}
            />
          </motion.g>
        </AnimatePresence>

        {/* nodes */}
        {NODES.map((n) => {
          const active = activeIds.has(n.id)
          const isB = n.id === 'as-b' || n.id === 'resource-b'
          const accent = isB ? tool.color : '#7c5cff'
          return (
            <g key={n.id}>
              <motion.rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={16}
                fill={active ? 'var(--node-bg-active)' : 'var(--node-bg)'}
                stroke={accent}
                strokeWidth={active ? 3 : 1.5}
                animate={active ? { scale: [1, 1.035, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, repeat: active ? Infinity : 0, repeatType: 'reverse' }}
                style={{
                  transformOrigin: `${n.x + n.w / 2}px ${n.y + n.h / 2}px`,
                  filter: active ? `drop-shadow(0 0 18px ${accent}66)` : 'none',
                }}
              />
              <foreignObject x={n.x + 10} y={n.y + 10} width={n.w - 20} height={n.h - 20}>
                <div className="diagram-node-content">
                  <div className="diagram-node-title" style={{ color: accent }}>
                    {labels[n.id].title}
                  </div>
                  <div className="diagram-node-sub">{labels[n.id].sub}</div>
                </div>
              </foreignObject>
            </g>
          )
        })}

        {/* user avatar chip attached to client, for narrative context */}
        <g transform={`translate(${nodeById.client.x + nodeById.client.w - 34}, ${nodeById.client.y - 26})`}>
          <circle r="18" fill="#1a1f33" stroke="#7c5cff" strokeWidth="1.5" />
          <text textAnchor="middle" dy="5" className="diagram-avatar-initials">
            {USER.name.split(' ').map((p) => p[0]).join('')}
          </text>
        </g>
        <text x={nodeById.client.x + nodeById.client.w - 34} y={nodeById.client.y - 52} textAnchor="middle" className="diagram-avatar-caption">
          acting for {USER.name.split(' ')[0]}
        </text>
      </svg>

      <div className="diagram-legend">
        <span className="diagram-legend-item">
          <i style={{ background: '#7c5cff' }} /> {AGENT_PLATFORM.clientId}
        </span>
        <span className="diagram-legend-item">
          <i style={{ background: tool.color }} /> {tool.name}
        </span>
        <span className="diagram-legend-item diagram-legend-step">
          Figure 1, step {step.phaseStep} of 6{step.rfc ? ` · RFC ${step.rfc}` : ''}
        </span>
      </div>
    </div>
  )
}
