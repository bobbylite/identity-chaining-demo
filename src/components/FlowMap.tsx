import { AGENT, IDP, NODES, USER, type NodeId } from '../data/world'
import type { Run, Step } from '../data/protocol'

const GLYPH: Record<NodeId, string> = {
  user: USER.initials,
  agent: '◆',
  idp: '⌘',
  ras: '⊘',
  rs: '▤',
}

interface Props {
  run: Run
  step: Step
}

export default function FlowMap({ run, step }: Props) {
  const { app } = run
  const failedHere = step.status === 'failed'

  const label = (id: NodeId): { label: string; sub: string } => {
    // The replay lab redeems the grant at a *different* app's authorization server,
    // so the destination node has to say so rather than keep the selected app's name.
    if (id === step.to && step.toLabel) {
      return { label: step.toLabel, sub: 'Wrong trust domain' }
    }
    switch (id) {
      case 'user':
        return { label: USER.name, sub: `${USER.title} · ${USER.org}` }
      case 'agent':
        return { label: AGENT.name, sub: NODES.agent.sub }
      case 'idp':
        return { label: IDP.name, sub: NODES.idp.sub }
      case 'ras':
        return { label: `${app.name} AS`, sub: 'Authorization server' }
      case 'rs':
        return { label: `${app.name} MCP`, sub: 'Protected resource' }
    }
  }

  const nodeClass = (id: NodeId) => {
    const involved = step.from === id || step.to === id
    if (!involved) return 'node'
    if (failedHere && step.to === id) return 'node node-fail'
    return 'node node-active'
  }

  const renderNode = (id: NodeId) => {
    const { label: l, sub } = label(id)
    return (
      <div className={nodeClass(id)} key={id}>
        <span className="node-icon" aria-hidden>
          {GLYPH[id]}
        </span>
        <span>
          <span className="node-label">{l}</span>
          <span className="node-sub" style={{ display: 'block' }}>
            {sub}
          </span>
        </span>
      </div>
    )
  }

  const req = step.request
  const wireClass = failedHere ? 'wire wire-fail' : step.crosses ? 'wire wire-cross' : 'wire'

  return (
    <div className="map">
      <div className="map-domains">
        <div className="domain domain-a">
          <div className="domain-label">Trust Domain A · {USER.org}</div>
          {(['user', 'agent', 'idp'] as NodeId[]).map(renderNode)}
        </div>

        <div className="domain domain-b">
          <div className="domain-label">{step.toDomain ?? `${app.domain} · ${app.name}`}</div>
          {/* When the grant is redeemed next door, this side of the map *is* the
              neighbour — the selected app's own MCP server plays no part in that hop. */}
          {(step.toDomain ? (['ras'] as NodeId[]) : (['ras', 'rs'] as NodeId[])).map(renderNode)}
          <div
            className="node"
            style={{ borderStyle: 'dashed', background: 'transparent', opacity: 0.75 }}
          >
            <span className="node-icon" aria-hidden>
              ↺
            </span>
            <span>
              <span className="node-label">Never sees Domain A credentials</span>
              <span className="node-sub" style={{ display: 'block' }}>
                It only has to trust {IDP.name}’s signature
              </span>
            </span>
          </div>
        </div>

        <div className="boundary" aria-hidden>
          <span className="boundary-tag">Trust boundary</span>
        </div>
      </div>

      <div className={wireClass}>
        <span className="wire-arrow" aria-hidden>
          {failedHere ? '✕' : '→'}
        </span>
        <span>
          <b>{label(step.from).label}</b> → <b>{label(step.to).label}</b>
          {req?.method ? (
            <>
              {' · '}
              <span className="mono">
                {req.method} {req.url}
              </span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}
