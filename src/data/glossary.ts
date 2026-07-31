// Plain-language explanations for the things you can click on: JWT claims and
// OAuth request parameters. Keyed by claim / parameter name.

export interface Entry {
  term: string
  text: string
  /** Marks the claims that are doing the security work in this story. */
  key?: boolean
}

export const CLAIMS: Record<string, Entry> = {
  iss: {
    term: 'iss — issuer',
    text: 'Who minted this token. The receiving server uses it to decide whose public keys to fetch, and whether it trusts that issuer at all.',
  },
  sub: {
    term: 'sub — subject',
    text: 'The human this token is about. It survives every hop of the chain, which is why the final audit log can name a person rather than a service account.',
    key: true,
  },
  aud: {
    term: 'aud — audience',
    text: 'The one party allowed to accept this token. Everyone else must reject it. This single claim is what keeps a grant for one trust domain from working in another.',
    key: true,
  },
  act: {
    term: 'act — actor',
    text: 'Who is acting on the subject’s behalf. It records delegation: the user is the subject, the agent is merely the actor. Strip it and you lose the ability to tell "Ryland did this" from "a bot did this as Ryland".',
    key: true,
  },
  scope: {
    term: 'scope',
    text: 'Exactly what this token may do — no more. The IdP caps it at what the agent was assigned, and the resource server enforces it on every call.',
    key: true,
  },
  exp: {
    term: 'exp — expires at',
    text: 'Unix time after which the token is dead. Grants live minutes, not months, so a leaked one stops being useful almost immediately.',
    key: true,
  },
  iat: { term: 'iat — issued at', text: 'When the token was minted. Used to reject tokens that are implausibly old.' },
  jti: {
    term: 'jti — JWT id',
    text: 'A unique id for this token. Lets a receiver remember which grants it has already redeemed and refuse a second use.',
  },
  client_id: {
    term: 'client_id',
    text: 'The application making the request — here, the AI agent. Distinct from the user, and tracked separately all the way through.',
  },
  resource: {
    term: 'resource',
    text: 'The specific API this grant is good for, narrower than the audience. An ID-JAG names both the authorization server that must accept it and the resource it unlocks.',
  },
  name: { term: 'name', text: 'Display name of the signed-in user, carried in the ID token.' },
  email: { term: 'email', text: 'The user’s email address, from the SSO session.' },
  auth_time: {
    term: 'auth_time',
    text: 'When the user actually authenticated. Lets a relying party demand a fresh login for sensitive operations.',
  },
  alg: { term: 'alg — algorithm', text: 'Signature algorithm. A verifier must pin this; accepting "none" is a classic JWT failure.' },
  typ: {
    term: 'typ — type',
    text: 'Declares what kind of token this is, so a token minted for one purpose cannot be quietly accepted for another.',
  },
  kid: { term: 'kid — key id', text: 'Which of the issuer’s published keys signed this, so verifiers pick the right one from the JWKS.' },
}

export const PARAMS: Record<string, Entry> = {
  grant_type: {
    term: 'grant_type',
    text: 'Which OAuth flow this request is. Token exchange for the swap at the IdP; jwt-bearer for redeeming the grant next door.',
  },
  requested_token_type: {
    term: 'requested_token_type',
    text: 'What the caller wants back. Asking for …:token-type:id-jag is what makes this a Cross App Access request rather than an ordinary exchange.',
    key: true,
  },
  subject_token: {
    term: 'subject_token',
    text: 'The token the agent already holds, offered as proof of who the user is.',
  },
  subject_token_type: {
    term: 'subject_token_type',
    text: 'Tells the IdP how to interpret the subject_token — an ID token and an access token are validated very differently.',
  },
  audience: {
    term: 'audience',
    text: 'The issuer identifier of the authorization server in the other trust domain. It becomes the aud claim of the grant, and it is what pins the result to one destination.',
    key: true,
  },
  resource: {
    term: 'resource',
    text: 'The API the agent intends to call. Narrows the grant beyond just naming the authorization server.',
  },
  scope: {
    term: 'scope',
    text: 'What the agent is asking to be allowed to do. The IdP will cut this down to the assignment, never up.',
    key: true,
  },
  client_id: { term: 'client_id', text: 'Identifies the agent to its own authorization server.' },
  client_assertion: {
    term: 'client_assertion',
    text: 'A JWT the agent signs with its own private key to authenticate itself — stronger than a shared client secret, because there is no secret to leak.',
  },
  client_assertion_type: {
    term: 'client_assertion_type',
    text: 'Declares that the client is authenticating with a signed JWT rather than a secret.',
  },
  assertion: {
    term: 'assertion',
    text: 'The grant itself, handed to the other domain’s authorization server. This is the moment the trust boundary is crossed.',
    key: true,
  },
}

export function lookup(name: string, kind: 'claim' | 'param'): Entry | undefined {
  return kind === 'claim' ? CLAIMS[name] : PARAMS[name]
}
