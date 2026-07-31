// The protocol engine.
//
// A "run" is one complete attempt by the agent to reach one resource app in another
// trust domain. Runs are *computed*, not scripted: change the protocol profile, the
// IdP's app-to-app policy, or a lab condition, and the steps, the HTTP bodies, the
// token claims and the outcome all change with it — including where the chain breaks.

import { APPS, APP_ORDER, AGENT, IDP, USER, type AppId, type NodeId, type ResourceApp } from './world'
import { jti, makeJwt, tamperJwt, type JwtPayload } from './tokens'

/** Which flavour of cross-domain access we're demonstrating. */
export type Profile = 'chaining' | 'xaa'

/** What we deliberately break, to see which party catches it. */
export type Condition = 'none' | 'revoked' | 'escalate' | 'replay' | 'expired' | 'tamper'

export type StepStatus = 'ok' | 'failed' | 'blocked'

export interface SpecRef {
  label: string
  href: string
  quote: string
}

export interface Http {
  method?: string
  url?: string
  status?: string
  headers: [string, string][]
  /** Form-encoded parameter list, rendered one-per-line and individually annotated. */
  form?: [string, string][]
  /** JSON body, already stringified. */
  json?: string
}

export interface TokenRef {
  id: string
  label: string
  value: string
  /** Why this token exists at this point in the chain. */
  note: string
  role: 'subject' | 'grant' | 'access'
}

export interface Step {
  n: number
  key: string
  title: string
  short: string
  from: NodeId
  to: NodeId
  /** `self` renders as a loop on the source node rather than an edge. */
  dir: 'out' | 'back' | 'self'
  /** Does this step cross the trust boundary between domain A and the app's domain? */
  crosses: boolean
  narrative: string
  /** Overrides the destination node's name — the replay lab redeems next door. */
  toLabel?: string
  /** Overrides the right-hand domain heading when the step leaves the selected app's domain. */
  toDomain?: string
  spec: SpecRef
  request?: Http
  response?: Http
  tokens: TokenRef[]
  status: StepStatus
}

export interface Failure {
  step: number
  /** Which party rejected the request. */
  enforcedBy: 'idp' | 'ras'
  enforcedByLabel: string
  error: string
  description: string
  /** The named control that caught it. */
  control: string
  lesson: string
}

export interface Run {
  app: ResourceApp
  profile: Profile
  condition: Condition
  steps: Step[]
  failure?: Failure
  ok: boolean
}

export type Policy = Record<AppId, boolean>

export const DEFAULT_POLICY: Policy = { crm: true, files: true, tracker: true, itsm: true }

// ---------------------------------------------------------------------------
// Spec references
// ---------------------------------------------------------------------------

export const SPECS = {
  chaining: {
    label: 'draft-ietf-oauth-identity-chaining',
    href: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/',
  },
  idjag: {
    label: 'draft-ietf-oauth-identity-assertion-authz-grant',
    href: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/',
  },
  rfc8693: { label: 'RFC 8693 · Token Exchange', href: 'https://www.rfc-editor.org/rfc/rfc8693' },
  rfc7523: { label: 'RFC 7523 · JWT Bearer Grant', href: 'https://www.rfc-editor.org/rfc/rfc7523' },
  rfc9728: {
    label: 'RFC 9728 · Protected Resource Metadata',
    href: 'https://www.rfc-editor.org/rfc/rfc9728',
  },
  rfc8414: {
    label: 'RFC 8414 · Authorization Server Metadata',
    href: 'https://www.rfc-editor.org/rfc/rfc8414',
  },
  mcp: {
    label: 'MCP · Authorization',
    href: 'https://modelcontextprotocol.io/specification/draft/basic/authorization',
  },
} as const

export const PROFILE_META: Record<
  Profile,
  { name: string; tagline: string; spec: { label: string; href: string }; blurb: string }
> = {
  chaining: {
    name: 'Identity Chaining',
    tagline: 'RFC 8693 → RFC 7523',
    spec: SPECS.chaining,
    blurb:
      'The general pattern. The agent swaps a token it already holds for a short-lived JWT authorization grant that is locked to one authorization server in another trust domain, then redeems that grant there for an access token.',
  },
  xaa: {
    name: 'Cross App Access',
    tagline: 'ID-JAG',
    spec: SPECS.idjag,
    blurb:
      'The enterprise profile of the same idea. The IdP that already runs SSO for both apps issues an Identity Assertion JWT Authorization Grant, so admins control app-to-app API access from the same place they control who can log in.',
  },
}

// ---------------------------------------------------------------------------
// Token shapes
// ---------------------------------------------------------------------------

const T0 = Math.floor(Date.now() / 1000)

const HEADER = (kid: string, typ = 'JWT') => ({ alg: 'ES256', typ, kid })

/** The token the agent already holds for the user, from enterprise SSO. */
function buildSubjectToken(profile: Profile): string {
  const base: JwtPayload = {
    iss: IDP.issuer,
    sub: USER.sub,
    aud: profile === 'xaa' ? AGENT.clientId : `${IDP.issuer}/agents`,
    iat: T0 - 240,
    exp: T0 + 3360,
    jti: jti(profile === 'xaa' ? 'idtok' : 'sess'),
    client_id: AGENT.clientId,
  }
  if (profile === 'xaa') {
    return makeJwt(HEADER(IDP.kid), {
      ...base,
      name: USER.name,
      email: USER.sub,
      auth_time: T0 - 240,
    })
  }
  return makeJwt(HEADER(IDP.kid, 'at+jwt'), { ...base, scope: 'agent.invoke profile' })
}

export const SUBJECT_TOKEN: Record<Profile, string> = {
  chaining: buildSubjectToken('chaining'),
  xaa: buildSubjectToken('xaa'),
}

function grantPayload(app: ResourceApp, profile: Profile, expired: boolean): JwtPayload {
  const iat = expired ? T0 - 400 : T0
  const exp = expired ? T0 - 100 : T0 + 300
  const common: JwtPayload = {
    iss: IDP.issuer,
    sub: USER.sub,
    aud: app.asIssuer,
    client_id: AGENT.clientId,
    scope: app.scope,
    iat,
    exp,
    jti: jti(profile === 'xaa' ? 'idjag' : 'grant'),
  }
  if (profile === 'xaa') {
    return { ...common, resource: app.apiBase }
  }
  return { ...common, act: { sub: AGENT.clientId, iss: IDP.issuer } }
}

function buildGrant(app: ResourceApp, profile: Profile, expired: boolean): string {
  const typ = profile === 'xaa' ? 'oauth-authz-req+jwt' : 'JWT'
  return makeJwt(HEADER(IDP.kid, typ), grantPayload(app, profile, expired))
}

function buildAccessToken(app: ResourceApp): string {
  return makeJwt(HEADER(`${app.id}-as-2026-01`, 'at+jwt'), {
    iss: app.asIssuer,
    sub: USER.sub,
    aud: app.apiBase,
    client_id: AGENT.clientId,
    act: { sub: AGENT.clientId, iss: IDP.issuer },
    scope: app.scope,
    iat: T0,
    exp: T0 + 900,
    jti: jti('at'),
  })
}

export const GRANT_TOKEN_TYPE: Record<Profile, string> = {
  chaining: 'urn:ietf:params:oauth:token-type:jwt',
  xaa: 'urn:ietf:params:oauth:token-type:id-jag',
}

// ---------------------------------------------------------------------------
// Lab conditions
// ---------------------------------------------------------------------------

export interface ConditionMeta {
  id: Condition
  name: string
  blurb: string
  /** Who is expected to catch it, for the pre-run hint. */
  caughtBy: 'idp' | 'ras' | null
}

export const CONDITIONS: ConditionMeta[] = [
  {
    id: 'none',
    name: 'Clean run',
    blurb: 'Everything behaves. The chain completes and the tool call returns data.',
    caughtBy: null,
  },
  {
    id: 'revoked',
    name: 'Assignment revoked',
    blurb:
      'An admin removes the agent’s assignment to this app in the IdP. Nothing changes inside the SaaS app itself.',
    caughtBy: 'idp',
  },
  {
    id: 'escalate',
    name: 'Scope escalation',
    blurb: 'The agent asks for admin-level scopes it was never granted.',
    caughtBy: 'idp',
  },
  {
    id: 'replay',
    name: 'Replay in the wrong domain',
    blurb: 'The agent takes a grant minted for one app and presents it to a different app.',
    caughtBy: 'ras',
  },
  {
    id: 'expired',
    name: 'Expired grant',
    blurb: 'The agent sits on the grant too long before redeeming it.',
    caughtBy: 'ras',
  },
  {
    id: 'tamper',
    name: 'Tampered payload',
    blurb: 'The agent edits the grant’s claims to widen its own scope before redeeming it.',
    caughtBy: 'ras',
  },
]

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const JSON_CT: [string, string] = ['content-type', 'application/json']
const FORM_CT: [string, string] = ['content-type', 'application/x-www-form-urlencoded']

function j(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function wrongTarget(app: ResourceApp): ResourceApp {
  const i = APP_ORDER.indexOf(app.id)
  return APPS[APP_ORDER[(i + 1) % APP_ORDER.length]]
}

// ---------------------------------------------------------------------------
// Run builder
// ---------------------------------------------------------------------------

export function buildRun(
  appId: AppId,
  profile: Profile,
  condition: Condition,
  policy: Policy = DEFAULT_POLICY,
): Run {
  const app = APPS[appId]
  const xaa = profile === 'xaa'
  const subject = SUBJECT_TOKEN[profile]

  // The IdP refuses to mint anything when the assignment is gone.
  const assignmentRevoked = condition === 'revoked' || policy[appId] === false
  const escalating = condition === 'escalate'
  const requestedScope = escalating ? app.overreachScope : app.scope

  const grantClean = buildGrant(app, profile, condition === 'expired')
  const grant =
    condition === 'tamper'
      ? tamperJwt(grantClean, { scope: app.overreachScope })
      : grantClean
  const access = buildAccessToken(app)

  // Where the grant actually gets presented — the replay lab sends it next door.
  const redeemAt = condition === 'replay' ? wrongTarget(app) : app

  const grantName = xaa ? 'ID-JAG' : 'JWT authorization grant'

  const steps: Step[] = []

  // -- Step 1 ---------------------------------------------------------------
  steps.push({
    n: 1,
    key: 'identity',
    title: xaa ? 'The user is already signed in' : 'The agent already holds the user’s token',
    short: 'Identity',
    from: 'user',
    to: 'agent',
    dir: 'out',
    crosses: false,
    narrative: xaa
      ? `${USER.name} signed into ${AGENT.name} through ${IDP.name} this morning — ordinary enterprise SSO, no new prompt. ${AGENT.name} is holding a signed ID token that says who she is. Notice what it is not: it is not a ${app.name} credential, and it grants nothing in ${app.name}'s trust domain.`
      : `${AGENT.name} is holding an access token ${IDP.name} issued for its own API. That token proves ${USER.name} is behind this session, but its audience is ${IDP.name}'s own trust domain. Presenting it to ${app.name} would be meaningless — and if ${app.name} did accept it, a single stolen token would unlock everything.`,
    spec: {
      ...(xaa ? SPECS.idjag : SPECS.chaining),
      quote: xaa
        ? 'The Requesting Application obtains an ID token for the user from the enterprise identity provider through its normal sign-in flow.'
        : 'The client in trust domain A is in possession of a token issued by the authorization server of trust domain A.',
    },
    tokens: [
      {
        id: 'subject',
        label: xaa ? 'ID token (from SSO)' : 'Agent platform access token',
        value: subject,
        note: `Audience is ${xaa ? AGENT.name : IDP.name}. Useless outside ${AGENT.domain}.`,
        role: 'subject',
      },
    ],
    status: 'ok',
  })

  // -- Step 2 ---------------------------------------------------------------
  steps.push({
    n: 2,
    key: 'discover',
    title: `Discover who guards ${app.name}`,
    short: 'Discover',
    from: 'agent',
    to: 'rs',
    dir: 'out',
    crosses: true,
    narrative: `${AGENT.name} calls the ${app.name} MCP server with no credential at all. The server answers 401 and, per RFC 9728, points at its own protected-resource metadata — which names the authorization server that governs it. The agent now knows exactly which authority in ${app.domain} it has to satisfy. Nothing here is pre-configured; the agent learns it at runtime.`,
    spec: {
      ...SPECS.rfc9728,
      quote:
        'The protected resource metadata document lists the authorization servers that can be used with this protected resource in the "authorization_servers" field.',
    },
    request: {
      method: 'GET',
      url: `${app.apiBase}/.well-known/oauth-protected-resource`,
      headers: [['accept', 'application/json']],
    },
    response: {
      status: '200 OK',
      headers: [JSON_CT],
      json: j({
        resource: app.apiBase,
        authorization_servers: [app.asIssuer],
        scopes_supported: [app.scope, ...app.overreachScope.split(' ').slice(1)],
        bearer_methods_supported: ['header'],
      }),
    },
    tokens: [],
    status: 'ok',
  })

  // -- Step 3: the exchange at the IdP --------------------------------------
  const exchangeForm: [string, string][] = xaa
    ? [
        ['grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange'],
        ['requested_token_type', 'urn:ietf:params:oauth:token-type:id-jag'],
        ['subject_token_type', 'urn:ietf:params:oauth:token-type:id_token'],
        ['subject_token', subject],
        ['audience', app.asIssuer],
        ['resource', app.apiBase],
        ['scope', requestedScope],
        ['client_id', AGENT.clientId],
        [
          'client_assertion_type',
          'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        ],
        ['client_assertion', '<signed client assertion>'],
      ]
    : [
        ['grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange'],
        ['requested_token_type', 'urn:ietf:params:oauth:token-type:jwt'],
        ['subject_token_type', 'urn:ietf:params:oauth:token-type:access_token'],
        ['subject_token', subject],
        ['resource', app.asIssuer],
        ['scope', requestedScope],
        ['client_id', AGENT.clientId],
      ]

  const exchangeFails = assignmentRevoked || escalating

  steps.push({
    n: 3,
    key: 'exchange',
    title: `Ask ${IDP.name} for a grant that reaches ${app.name}`,
    short: xaa ? 'Get ID-JAG' : 'Exchange',
    from: 'agent',
    to: 'idp',
    dir: 'out',
    crosses: false,
    narrative: xaa
      ? `${AGENT.name} hands its ID token back to ${IDP.name} and asks for something new: an ID-JAG whose audience is ${app.asLabel}. This is the policy decision point of the whole story. ${IDP.name} already knows which applications the admin has connected to which, and it checks that assignment before it mints anything.`
      : `${AGENT.name} presents the user's token to its own authorization server and asks it to be exchanged for a grant addressed to ${app.asLabel}. ${IDP.name} decides here — and only here — whether ${AGENT.name} is allowed to act for ${USER.name} inside ${app.domain}, and at what scope.`,
    spec: {
      ...(xaa ? SPECS.idjag : SPECS.rfc8693),
      quote: xaa
        ? 'The requested_token_type value urn:ietf:params:oauth:token-type:id-jag indicates that an Identity Assertion JWT Authorization Grant is being requested.'
        : 'The client in trust domain A exchanges a token it has in its possession with the authorization server in trust domain A for a JWT authorization grant.',
    },
    request: {
      method: 'POST',
      url: IDP.tokenEndpoint,
      headers: [FORM_CT],
      form: exchangeForm,
    },
    response: exchangeFails
      ? {
          status: assignmentRevoked ? '403 Forbidden' : '400 Bad Request',
          headers: [JSON_CT],
          json: assignmentRevoked
            ? j({
                error: 'access_denied',
                error_description: `Client "${AGENT.clientId}" has no active assignment to resource application "${app.name}".`,
              })
            : j({
                error: 'invalid_scope',
                error_description: `Requested scope exceeds the scopes granted to "${AGENT.clientId}" for "${app.name}". Granted: "${app.scope}".`,
              }),
        }
      : {
          status: '200 OK',
          headers: [JSON_CT, ['cache-control', 'no-store']],
          json: j({
            issued_token_type: GRANT_TOKEN_TYPE[profile],
            access_token: grantClean,
            token_type: xaa ? 'N_A' : 'N_A',
            scope: app.scope,
            expires_in: 300,
          }),
        },
    tokens: exchangeFails
      ? [
          {
            id: 'subject',
            label: xaa ? 'ID token presented' : 'Subject token presented',
            value: subject,
            note: 'Accepted as proof of the user — but proof alone is not authorization.',
            role: 'subject',
          },
        ]
      : [
          {
            id: 'subject',
            label: xaa ? 'ID token presented' : 'Subject token presented',
            value: subject,
            note: 'What went in: proof of who the user is.',
            role: 'subject',
          },
          {
            id: 'grant',
            label: `${grantName} returned`,
            value: grantClean,
            note: `What came out: aud is pinned to ${app.asIssuer} and it expires in 5 minutes.`,
            role: 'grant',
          },
        ],
    status: exchangeFails ? 'failed' : 'ok',
  })

  // -- Step 4: cross the boundary -------------------------------------------
  const redeemFails =
    condition === 'replay' || condition === 'expired' || condition === 'tamper'

  const redeemNarrative = () => {
    if (condition === 'replay')
      return `${AGENT.name} takes the grant ${IDP.name} minted for ${app.name} and presents it to ${redeemAt.asLabel} instead. The token is genuine and its signature verifies perfectly — but its aud claim names ${app.asIssuer}, and ${redeemAt.name} is not that. This is the single most important line of defence in the whole design: a grant is a key cut for one lock.`
    if (condition === 'expired')
      return `${AGENT.name} holds the grant for seven minutes before redeeming it. ${app.asLabel} checks exp against its own clock and refuses. Short lifetimes are why a leaked grant in a log file is a small problem rather than a standing back door.`
    if (condition === 'tamper')
      return `${AGENT.name} base64-decodes the grant, rewrites the scope claim to include admin permissions, and re-encodes it. It never touches the signature, because it cannot — it has no key. ${app.asLabel} fetches ${IDP.name}'s public keys and the verification fails on the first check.`
    return `${AGENT.name} crosses the trust boundary. It presents the ${grantName} to ${app.asLabel} as a JWT bearer assertion. ${app.name} never sees ${AGENT.name}'s domain-A credentials, never sees the user's ID token, and never has to trust ${AGENT.name} directly — it only has to trust ${IDP.name}'s signature and the claims inside.`
  }

  steps.push({
    n: 4,
    key: 'redeem',
    title: `Redeem the grant at ${redeemAt.name}`,
    short: 'Cross',
    from: 'agent',
    to: 'ras',
    dir: 'out',
    crosses: true,
    narrative: redeemNarrative(),
    toLabel: redeemAt.id === app.id ? undefined : `${redeemAt.name} AS`,
    toDomain: redeemAt.id === app.id ? undefined : `${redeemAt.domain} · ${redeemAt.name}`,
    spec: {
      ...SPECS.rfc7523,
      quote:
        'To use a JWT as an authorization grant, the client uses an access token request with grant_type set to urn:ietf:params:oauth:grant-type:jwt-bearer and the JWT in the assertion parameter.',
    },
    request: {
      method: 'POST',
      url: `${redeemAt.asIssuer}/oauth2/v1/token`,
      headers: [FORM_CT],
      form: [
        ['grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer'],
        ['assertion', grant],
        ['scope', app.scope],
      ],
    },
    response: (() => {
      if (condition === 'replay')
        return {
          status: '400 Bad Request',
          headers: [JSON_CT],
          json: j({
            error: 'invalid_grant',
            error_description: `Assertion audience "${app.asIssuer}" does not match this authorization server ("${redeemAt.asIssuer}").`,
          }),
        }
      if (condition === 'expired')
        return {
          status: '400 Bad Request',
          headers: [JSON_CT],
          json: j({
            error: 'invalid_grant',
            error_description: 'Assertion has expired. The "exp" claim is in the past.',
          }),
        }
      if (condition === 'tamper')
        return {
          status: '400 Bad Request',
          headers: [JSON_CT],
          json: j({
            error: 'invalid_grant',
            error_description: `Assertion signature verification failed against JWKS at ${IDP.jwksUri}.`,
          }),
        }
      return {
        status: '200 OK',
        headers: [JSON_CT, ['cache-control', 'no-store']],
        json: j({
          access_token: access,
          token_type: 'Bearer',
          expires_in: 900,
          scope: app.scope,
        }),
      }
    })(),
    tokens: redeemFails
      ? [
          {
            id: 'grant',
            label: `${grantName} presented`,
            value: grant,
            note:
              condition === 'replay'
                ? `aud says ${app.asIssuer}. It was handed to ${redeemAt.asIssuer}.`
                : condition === 'expired'
                  ? 'exp is already in the past.'
                  : 'scope was edited after signing — the signature no longer matches.',
            role: 'grant',
          },
        ]
      : [
          {
            id: 'grant',
            label: `${grantName} presented`,
            value: grant,
            note: 'The agent’s only credential in this domain — and it is about to be spent.',
            role: 'grant',
          },
          {
            id: 'access',
            label: `${app.name} access token`,
            value: access,
            note: `Issued by ${app.name} itself. sub is still ${USER.name}; act still names the agent.`,
            role: 'access',
          },
        ],
    status: redeemFails ? 'failed' : exchangeFails ? 'blocked' : 'ok',
  })

  // -- Step 5: the actual work ----------------------------------------------
  const callBlocked = exchangeFails || redeemFails
  steps.push({
    n: 5,
    key: 'call',
    title: `Call ${app.tool}`,
    short: 'Call tool',
    from: 'agent',
    to: 'rs',
    dir: 'out',
    crosses: true,
    narrative: callBlocked
      ? `This never happens. Without an access token from ${app.asLabel} the agent has nothing to present, and the ${app.name} MCP server answers every unauthenticated call the same way it did in step 2 — 401. The user's data was never at risk, and no one had to write a line of app-specific security code to get that outcome.`
      : `Finally, the work. ${AGENT.name} invokes the MCP tool with the access token ${app.name} issued. The resource server enforces "${app.scope}" and, because sub is ${USER.name} and act is ${AGENT.clientId}, its audit log records exactly what happened: this agent, acting for this person, read this record at this time.`,
    spec: {
      ...SPECS.mcp,
      quote:
        'MCP clients MUST use the Authorization request header field when making requests to an MCP server, with the access token obtained from the authorization server.',
    },
    request: {
      method: 'POST',
      url: `${app.apiBase}${app.apiPath}`,
      headers: [
        ['authorization', callBlocked ? '<no token to send>' : `Bearer ${access}`],
        JSON_CT,
      ],
      json: j({ name: app.tool, arguments: app.toolArgs }),
    },
    response: callBlocked
      ? {
          status: '401 Unauthorized',
          headers: [
            [
              'www-authenticate',
              `Bearer resource_metadata="${app.apiBase}/.well-known/oauth-protected-resource"`,
            ],
          ],
          json: j({ error: 'invalid_token', error_description: 'No credentials presented.' }),
        }
      : {
          status: '200 OK',
          headers: [JSON_CT],
          json: j(app.responseBody),
        },
    tokens: callBlocked
      ? []
      : [
          {
            id: 'access',
            label: 'Access token presented',
            value: access,
            note: `Scoped to "${app.scope}" and to ${app.apiBase}. Nothing else in ${app.name} is reachable with it.`,
            role: 'access',
          },
        ],
    status: callBlocked ? 'blocked' : 'ok',
  })

  // -- Failure summary -------------------------------------------------------
  let failure: Failure | undefined
  if (assignmentRevoked) {
    failure = {
      step: 3,
      enforcedBy: 'idp',
      enforcedByLabel: IDP.name,
      error: 'access_denied',
      description: `${IDP.name} has no assignment connecting ${AGENT.name} to ${app.name}.`,
      control: 'App-to-app assignment',
      lesson: `Access died at the identity provider. Nobody logged into ${app.name}, nobody rotated a secret, nobody edited an allow-list inside the SaaS app. One toggle in the place that already governs SSO, and the agent's reach into that trust domain is gone — everywhere, immediately.`,
    }
  } else if (escalating) {
    failure = {
      step: 3,
      enforcedBy: 'idp',
      enforcedByLabel: IDP.name,
      error: 'invalid_scope',
      description: `The agent asked for "${app.overreachScope}" but is only entitled to "${app.scope}".`,
      control: 'Scope entitlement check',
      lesson: `The agent can ask for anything it likes; asking is free. The ceiling is set by the IdP, not by the agent's own code and not by whatever a prompt talked it into requesting. A compromised or jailbroken agent still cannot mint authority it was never assigned.`,
    }
  } else if (condition === 'replay') {
    failure = {
      step: 4,
      enforcedBy: 'ras',
      enforcedByLabel: redeemAt.asLabel,
      error: 'invalid_grant',
      description: `Audience mismatch: the assertion names ${app.asIssuer}.`,
      control: 'Audience restriction (aud)',
      lesson: `This is why grants are minted per destination rather than once per session. Even a perfectly valid, unexpired, correctly-signed grant is inert one domain over. Compromise of ${app.name} yields nothing usable against ${redeemAt.name}.`,
    }
  } else if (condition === 'expired') {
    failure = {
      step: 4,
      enforcedBy: 'ras',
      enforcedByLabel: app.asLabel,
      error: 'invalid_grant',
      description: 'The assertion’s exp claim is in the past.',
      control: 'Short lifetime (exp)',
      lesson: `Compare this to the long-lived refresh token an agent would otherwise be storing for every app it touches. A grant that dies in five minutes turns "credential found in a log" from an incident into a footnote.`,
    }
  } else if (condition === 'tamper') {
    failure = {
      step: 4,
      enforcedBy: 'ras',
      enforcedByLabel: app.asLabel,
      error: 'invalid_grant',
      description: 'Signature does not verify against the IdP’s published keys.',
      control: 'Signature verification (JWKS)',
      lesson: `The claims in a grant are readable by anyone holding it — that is by design, and it is not a leak. What matters is that they are not editable. Authority comes from the signature, so the agent cannot promote itself no matter what it writes into the payload.`,
    }
  }

  return { app, profile, condition, steps, failure, ok: !failure }
}
