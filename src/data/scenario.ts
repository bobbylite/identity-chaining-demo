import { makeJwt, jti } from './tokens'

export type EntityId = 'as-a' | 'client' | 'as-b' | 'resource-b'
export type Phase = 'salesforce' | 'servicenow'
export type EdgeKind = 'forward' | 'backward' | 'loop'

export interface ToolMeta {
  phase: Phase
  name: string
  color: string
  glow: string
  asLabel: string
  asIssuer: string
  resourceLabel: string
  resourceBase: string
  scope: string
  mcpCall: string
  mcpResultSummary: string
}

const now = () => Math.floor(Date.now() / 1000)

export const AGENT_PLATFORM = {
  issuer: 'https://as.agentplatform.example',
  tokenEndpoint: 'https://as.agentplatform.example/token',
  clientId: 'mcp-agent-nova',
  apiAudience: 'https://api.agentplatform.example',
}

export const USER = {
  name: 'Priya Natarajan',
  sub: 'priya.natarajan@contoso.example',
  role: 'Enterprise Account Executive, Contoso',
}

export const TOOLS: Record<Phase, ToolMeta> = {
  salesforce: {
    phase: 'salesforce',
    name: 'Salesforce',
    color: '#00A1E0',
    glow: 'rgba(0,161,224,0.55)',
    asLabel: 'Salesforce Authorization Server',
    asIssuer: 'https://as.salesforce.example',
    resourceLabel: 'Salesforce REST API',
    resourceBase: 'https://api.salesforce.example',
    scope: 'opportunities.read',
    mcpCall: 'salesforce.query_opportunity({ account: "Acme Corp", stage: "open" })',
    mcpResultSummary: 'Found 1 open opportunity: "Acme Corp — Enterprise Renewal", $420,000, stage Negotiation, close date 2026-08-14.',
  },
  servicenow: {
    phase: 'servicenow',
    name: 'ServiceNow',
    color: '#62D84E',
    glow: 'rgba(98,216,78,0.55)',
    asLabel: 'ServiceNow Authorization Server',
    asIssuer: 'https://as.servicenow.example',
    resourceLabel: 'ServiceNow Table API',
    resourceBase: 'https://instance.servicenow.example/api/now',
    scope: 'incident.write',
    mcpCall: 'servicenow.create_incident({ short_description: "Blocking issue on Acme Corp renewal", link: "SFDC:0064x00000AbCdE" })',
    mcpResultSummary: 'Created INC0010234, priority High, assigned to Integrations queue, linked to the Acme Corp opportunity.',
  },
}

// --- Tokens (built once per module load; structurally real JWTs, fake signatures) ---

const iat0 = now()

export const userSessionToken = makeJwt(
  { alg: 'ES256', typ: 'JWT', kid: 'agentplatform-2026-03' },
  {
    iss: AGENT_PLATFORM.issuer,
    sub: USER.sub,
    aud: AGENT_PLATFORM.apiAudience,
    client_id: AGENT_PLATFORM.clientId,
    scope: 'agent.invoke profile',
    iat: iat0,
    exp: iat0 + 3600,
    jti: jti('sess'),
  },
)

function makeGrant(tool: ToolMeta) {
  const iat = now()
  return makeJwt(
    { alg: 'ES256', typ: 'JWT', kid: 'agentplatform-2026-03' },
    {
      iss: AGENT_PLATFORM.issuer,
      sub: USER.sub,
      aud: tool.asIssuer,
      act: { sub: AGENT_PLATFORM.clientId, iss: AGENT_PLATFORM.issuer },
      scope: tool.scope,
      iat,
      exp: iat + 60,
      jti: jti('grant'),
    },
  )
}

function makeAccessToken(tool: ToolMeta) {
  const iat = now()
  return makeJwt(
    { alg: 'ES256', typ: 'JWT', kid: `${tool.phase}-as-2026-01` },
    {
      iss: tool.asIssuer,
      sub: USER.sub,
      aud: tool.resourceBase,
      act: { sub: AGENT_PLATFORM.clientId, iss: AGENT_PLATFORM.issuer },
      scope: tool.scope,
      iat,
      exp: iat + 300,
      jti: jti('at'),
    },
  )
}

export const grantJwt: Record<Phase, string> = {
  salesforce: makeGrant(TOOLS.salesforce),
  servicenow: makeGrant(TOOLS.servicenow),
}

export const accessToken: Record<Phase, string> = {
  salesforce: makeAccessToken(TOOLS.salesforce),
  servicenow: makeAccessToken(TOOLS.servicenow),
}

// --- Step script ---

export interface HttpBlock {
  method: string
  url: string
  headers?: [string, string][]
  body?: string
}

export interface HttpResponseBlock {
  status: string
  headers?: [string, string][]
  body: string
}

export interface StepDef {
  id: number
  phase: Phase
  phaseStep: 1 | 2 | 3 | 4 | 5 | 6
  title: string
  edge: { from: EntityId; to: EntityId; kind: EdgeKind }
  rfc?: '8693' | '7523' | '8414'
  specQuote: string
  narration: string
  request?: HttpBlock
  response?: HttpResponseBlock
  token?: { label: string; value: string }
}

function step(tool: Phase, s: Omit<StepDef, 'id' | 'phase'>): Omit<StepDef, 'id'> {
  return { phase: tool, ...s }
}

function buildPhaseSteps(tool: ToolMeta): Omit<StepDef, 'id'>[] {
  const grant = grantJwt[tool.phase]
  const at = accessToken[tool.phase]

  return [
    step(tool.phase, {
      phaseStep: 1,
      title: `Discover ${tool.name}'s authorization server`,
      edge: { from: 'client', to: 'as-b', kind: 'loop' },
      rfc: '8414',
      specQuote: 'The client in trust domain A discovers the location of the authorization server of trust domain B.',
      narration: `Before it can call the ${tool.name} MCP tool, the agent resolves which authorization server governs ${tool.name} for this organization — e.g. via OAuth Authorization Server Metadata (RFC 8414). This tells the client where to send the token-exchange and grant requests in the next steps.`,
      request: {
        method: 'GET',
        url: `${tool.asIssuer}/.well-known/oauth-authorization-server`,
      },
      response: {
        status: '200 OK',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify(
          {
            issuer: tool.asIssuer,
            token_endpoint: `${tool.asIssuer}/token`,
            jwks_uri: `${tool.asIssuer}/.well-known/jwks.json`,
            grant_types_supported: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
          },
          null,
          2,
        ),
      },
    }),
    step(tool.phase, {
      phaseStep: 2,
      title: 'Exchange the user’s token for an authorization grant',
      edge: { from: 'client', to: 'as-a', kind: 'forward' },
      rfc: '8693',
      specQuote: 'The client in trust domain A exchanges a token it has in its possession with the authorization server in trust domain A for a JWT authorization grant.',
      narration: `The agent (MCP client) doesn't have a ${tool.name}-specific credential — only Priya's existing Agent Platform session token. It presents that token to its own authorization server (Trust Domain A) via RFC 8693 Token Exchange, asking for a grant scoped to reach ${tool.name}.`,
      request: {
        method: 'POST',
        url: `${AGENT_PLATFORM.tokenEndpoint}`,
        headers: [['content-type', 'application/x-www-form-urlencoded']],
        body: [
          'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange',
          `resource=${encodeURIComponent(tool.asIssuer)}`,
          `subject_token=${userSessionToken}`,
          'subject_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token',
        ].join('\n&'),
      },
      token: { label: "Subject token presented (Priya's session)", value: userSessionToken },
    }),
    step(tool.phase, {
      phaseStep: 3,
      title: 'Receive the JWT authorization grant',
      edge: { from: 'as-a', to: 'client', kind: 'backward' },
      rfc: '8693',
      specQuote: 'The authorization server of trust domain A processes the request and returns a JWT authorization grant that the client can use with the authorization server of trust domain B.',
      narration: `Trust Domain A's authorization server mints a short-lived JWT authorization grant. Its "aud" claim is locked to ${tool.asLabel} only — per the spec, this prevents the client from replaying the grant against a different trust domain. Its "act" claim records that the agent (${AGENT_PLATFORM.clientId}) is acting for Priya, not as itself.`,
      response: {
        status: '200 OK',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify(
          {
            access_token: grant,
            token_type: 'N_A',
            issued_token_type: 'urn:ietf:params:oauth:token-type:jwt',
            expires_in: 60,
          },
          null,
          2,
        ),
      },
      token: { label: 'JWT authorization grant (aud-restricted to ' + tool.name + ')', value: grant },
    }),
    step(tool.phase, {
      phaseStep: 4,
      title: `Present the grant to ${tool.name}`,
      edge: { from: 'client', to: 'as-b', kind: 'forward' },
      rfc: '7523',
      specQuote: 'The client in trust domain A presents the authorization grant to the authorization server of trust domain B.',
      narration: `The agent now crosses the trust boundary: it presents the JWT authorization grant to ${tool.asLabel} as a JWT bearer assertion (RFC 7523). ${tool.name} has never seen the agent's Trust-Domain-A credentials directly — only this narrowly-scoped, short-lived, audience-locked grant.`,
      request: {
        method: 'POST',
        url: `${tool.asIssuer}/token`,
        headers: [['content-type', 'application/x-www-form-urlencoded']],
        body: [
          'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer',
          `assertion=${grant}`,
        ].join('\n&'),
      },
      token: { label: 'Assertion presented (the grant from step 3)', value: grant },
    }),
    step(tool.phase, {
      phaseStep: 5,
      title: `Receive a ${tool.name}-scoped access token`,
      edge: { from: 'as-b', to: 'client', kind: 'backward' },
      rfc: '7523',
      specQuote: 'Authorization server of trust domain B validates the JWT authorization grant and returns an access token.',
      narration: `${tool.asLabel} validates the grant's signature, audience, and expiry, then mints an access token scoped to "${tool.scope}" — still carrying Priya as the subject and the agent as the actor. ${tool.name} now knows exactly who it's serving and who is asking on their behalf.`,
      response: {
        status: '200 OK',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify(
          { access_token: at, token_type: 'Bearer', expires_in: 300, scope: tool.scope },
          null,
          2,
        ),
      },
      token: { label: `${tool.name} access token`, value: at },
    }),
    step(tool.phase, {
      phaseStep: 6,
      title: `Call the ${tool.name} MCP tool`,
      edge: { from: 'client', to: 'resource-b', kind: 'forward' },
      specQuote: 'The client in trust domain A uses the access token received from the authorization server in trust domain B to access the protected resource.',
      narration: `With a valid, correctly-scoped access token in hand, the agent finally invokes the MCP tool. ${tool.resourceLabel} enforces "${tool.scope}" and can attribute the call to Priya specifically — full identity and authorization chaining, end to end.`,
      request: {
        method: 'POST',
        url: `${tool.resourceBase}${tool.phase === 'salesforce' ? '/query' : '/table/incident'}`,
        headers: [['authorization', `Bearer ${at}`], ['content-type', 'application/json']],
        body: tool.mcpCall,
      },
      response: {
        status: '200 OK',
        headers: [['content-type', 'application/json']],
        body: tool.mcpResultSummary,
      },
      token: { label: `${tool.name} access token (presented as Bearer)`, value: at },
    }),
  ]
}

export const STEPS: StepDef[] = [
  ...buildPhaseSteps(TOOLS.salesforce),
  ...buildPhaseSteps(TOOLS.servicenow),
].map((s, i) => ({ id: i + 1, ...s }))

export const TOTAL_STEPS = STEPS.length
