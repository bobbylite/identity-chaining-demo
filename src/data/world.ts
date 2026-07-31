// The cast of the cross-domain access story: one user, one AI agent, one enterprise
// IdP, and four downstream SaaS apps — each app its own trust domain with its own
// authorization server and its own MCP resource server.
//
// Everything here is fictional. Domains use `.example` (RFC 2606) on purpose.

export type AppId = 'crm' | 'itsm' | 'tracker' | 'files'

export type NodeId = 'user' | 'agent' | 'idp' | 'ras' | 'rs'

export interface ResourceApp {
  id: AppId
  /** Display name of the SaaS product. */
  name: string
  /** One-word category shown under the name. */
  kind: string
  /** Single character used as a flat, text-only "logo". */
  mark: string
  /** CSS custom-property suffix: `--app-<hue>` / `--app-<hue>-soft`. */
  hue: 'blue' | 'green' | 'violet' | 'amber'
  /** Trust domain label, e.g. "Trust Domain B". */
  domain: string
  /** Issuer identifier of this app's authorization server. */
  asIssuer: string
  asLabel: string
  /** Base URL of the protected resource / MCP server. */
  apiBase: string
  apiLabel: string
  /** Path the agent's tool call actually hits. */
  apiPath: string
  /** The scope the agent asks for. Deliberately narrow. */
  scope: string
  /** A wider scope the agent is NOT entitled to — used by the escalation lab. */
  overreachScope: string
  /** MCP tool name and arguments the agent invokes. */
  tool: string
  toolArgs: Record<string, unknown>
  /** What the agent tells the user after the call succeeds. */
  result: string
  /** Short JSON body the resource server returns. */
  responseBody: unknown
  /** Why the agent needs this app for the user's task. */
  because: string
}

export const USER = {
  name: 'Ryland Grace',
  sub: 'ryland.grace@contoso.example',
  title: 'Enterprise Account Executive',
  org: 'Contoso',
  initials: 'RG',
}

export const AGENT = {
  name: 'Nova',
  longName: 'Nova — Contoso’s internal AI assistant',
  clientId: 'nova-agent',
  role: 'Requesting application / MCP client',
  domain: 'Trust Domain A',
}

export const IDP = {
  name: 'Contoso IdP',
  role: 'Enterprise identity provider & authorization server',
  issuer: 'https://idp.contoso.example',
  tokenEndpoint: 'https://idp.contoso.example/oauth2/v1/token',
  jwksUri: 'https://idp.contoso.example/oauth2/v1/keys',
  domain: 'Trust Domain A',
  kid: 'contoso-idp-2026-03',
}

export const NODES: Record<NodeId, { label: string; sub: string; side: 'a' | 'b' }> = {
  user: { label: USER.name.split(' ')[0], sub: 'End user', side: 'a' },
  agent: { label: AGENT.name, sub: 'AI agent · MCP client', side: 'a' },
  idp: { label: IDP.name, sub: 'Authorization server', side: 'a' },
  ras: { label: 'Resource AS', sub: 'App’s authorization server', side: 'b' },
  rs: { label: 'MCP server', sub: 'Protected resource', side: 'b' },
}

export const APPS: Record<AppId, ResourceApp> = {
  crm: {
    id: 'crm',
    name: 'Salesforce',
    kind: 'CRM',
    mark: 'S',
    hue: 'blue',
    domain: 'Trust Domain B',
    asIssuer: 'https://login.salesforce.example',
    asLabel: 'Salesforce authorization server',
    apiBase: 'https://api.salesforce.example',
    apiLabel: 'Salesforce MCP server',
    apiPath: '/mcp/tools/call',
    scope: 'opportunities.read',
    overreachScope: 'opportunities.read opportunities.write accounts.admin',
    tool: 'salesforce.find_opportunity',
    toolArgs: { account: 'Acme Corp', stage: 'open' },
    result:
      'Acme Corp — Enterprise Renewal, $420,000, stage Negotiation, closes 2026-08-14. Flagged “at risk” by the account team.',
    responseBody: {
      opportunity_id: '0064x00000AbCdE',
      name: 'Acme Corp — Enterprise Renewal',
      amount: 420000,
      stage: 'Negotiation',
      close_date: '2026-08-14',
      risk: 'at_risk',
    },
    because: 'to find the renewal Ryland is asking about',
  },
  files: {
    id: 'files',
    name: 'Google Drive',
    kind: 'Documents',
    mark: 'D',
    hue: 'green',
    domain: 'Trust Domain C',
    asIssuer: 'https://oauth.drive.example',
    asLabel: 'Drive authorization server',
    apiBase: 'https://api.drive.example',
    apiLabel: 'Drive MCP server',
    apiPath: '/mcp/tools/call',
    scope: 'files.read',
    overreachScope: 'files.read files.write files.share.external',
    tool: 'drive.search_files',
    toolArgs: { query: 'Acme Corp renewal contract', limit: 3 },
    result:
      'Found “Acme Corp — MSA 2024 (countersigned).pdf”, last modified 2026-07-02 by legal@contoso.example.',
    responseBody: {
      files: [
        {
          id: 'file_9x2Kd',
          name: 'Acme Corp — MSA 2024 (countersigned).pdf',
          modified: '2026-07-02T14:11:00Z',
          owner: 'legal@contoso.example',
        },
      ],
    },
    because: 'to pull the signed contract behind that renewal',
  },
  tracker: {
    id: 'tracker',
    name: 'Jira',
    kind: 'Issue tracking',
    mark: 'J',
    hue: 'violet',
    domain: 'Trust Domain D',
    asIssuer: 'https://auth.jira.example',
    asLabel: 'Jira authorization server',
    apiBase: 'https://api.jira.example',
    apiLabel: 'Jira MCP server',
    apiPath: '/mcp/tools/call',
    scope: 'issues.write',
    overreachScope: 'issues.write project.admin users.read',
    tool: 'jira.create_issue',
    toolArgs: {
      project: 'ACME',
      summary: 'Provisioning blocker on Acme Corp renewal',
      priority: 'High',
    },
    result: 'Opened ACME-4417 (High) and linked it to the Acme Corp opportunity.',
    responseBody: { key: 'ACME-4417', status: 'Open', priority: 'High', reporter: USER.sub },
    because: 'to file the engineering blocker',
  },
  itsm: {
    id: 'itsm',
    name: 'ServiceNow',
    kind: 'ITSM',
    mark: 'N',
    hue: 'amber',
    domain: 'Trust Domain E',
    asIssuer: 'https://auth.servicenow.example',
    asLabel: 'ServiceNow authorization server',
    apiBase: 'https://contoso.servicenow.example',
    apiLabel: 'ServiceNow MCP server',
    apiPath: '/mcp/tools/call',
    scope: 'incident.write',
    overreachScope: 'incident.write cmdb.write user.admin',
    tool: 'servicenow.create_incident',
    toolArgs: {
      short_description: 'Acme Corp renewal blocked on entitlement sync',
      urgency: '2',
    },
    result: 'Raised INC0010234 (urgency 2) against the Integrations queue.',
    responseBody: {
      number: 'INC0010234',
      sys_id: 'a1b2c3d4e5f6',
      assignment_group: 'Integrations',
      opened_by: USER.sub,
    },
    because: 'to open the incident with the platform team',
  },
}

export const APP_ORDER: AppId[] = ['crm', 'files', 'tracker', 'itsm']

/** The single prompt that fans out across every trust domain. */
export const AGENT_PROMPT =
  'The Acme Corp renewal looks stuck. Pull up the opportunity, find the signed contract, then file a Jira issue and a ServiceNow incident for the provisioning blocker.'
