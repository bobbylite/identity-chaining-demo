// The narrative frame around the protocol: what breaks without cross-domain access,
// and what you actually get once you have it.

export interface Contrast {
  id: string
  question: string
  without: string
  with: string
}

export const CONTRASTS: Contrast[] = [
  {
    id: 'onboarding',
    question: 'How does the agent get in?',
    without:
      'Every user connects every app by hand. Four OAuth consent screens per person, times the whole company, and a new one each time you add a tool.',
    with:
      'The admin connects the agent to the app once, in the IdP. Users who already have SSO to both simply find it working.',
  },
  {
    id: 'storage',
    question: 'What does the agent hold?',
    without:
      'A vault of long-lived refresh tokens — one per user, per app. The agent becomes the single most valuable target in the company.',
    with:
      'Nothing durable. It mints a grant when it needs one, spends it within minutes, and holds no standing authority anywhere.',
  },
  {
    id: 'identity',
    question: 'Who does the app think is calling?',
    without:
      'Usually a shared service account. The audit log says "integration-bot", so you cannot tell which employee triggered what.',
    with:
      'The user. sub carries the person end to end and act names the agent, so the log reads "this agent, acting for Ryland".',
  },
  {
    id: 'blast',
    question: 'What happens when the agent is compromised?',
    without:
      'Whatever the stolen tokens allow, for as long as they live, across every app and every user. Cleanup means revoking thousands of grants app by app.',
    with:
      'The attacker holds tokens that expire in minutes and only work against one audience. Pull the assignment and the next exchange fails everywhere at once.',
  },
  {
    id: 'offboard',
    question: 'The employee leaves. Now what?',
    without:
      'Their tokens keep working until someone remembers to revoke them in each SaaS app individually.',
    with:
      'Deprovisioning in the IdP ends it. There is no exchange to be had without a live user, so every downstream app closes at the same instant.',
  },
]

export interface Pillar {
  title: string
  text: string
}

export const PILLARS: Pillar[] = [
  {
    title: 'One policy point',
    text: 'The identity provider decides which agent may act in which app, for whom, at what scope. Not four SaaS admin consoles, and not the agent’s own configuration file.',
  },
  {
    title: 'No new consent screens',
    text: 'The user already signed into both applications. The protocol reuses that, instead of asking a human to approve something they have no context to evaluate.',
  },
  {
    title: 'Credentials that cannot travel',
    text: 'Every token is pinned to one audience and dies in minutes. A grant that leaks out of one trust domain is worthless in the next.',
  },
  {
    title: 'Attribution that survives the hop',
    text: 'The user stays the subject and the agent is recorded as the actor, so downstream audit logs name a person and the software that acted for them.',
  },
  {
    title: 'Revocation that actually revokes',
    text: 'Turn the assignment off and the chain breaks at the first step, for every user and every app at once — no per-app cleanup.',
  },
  {
    title: 'Nothing custom in the agent',
    text: 'It is ordinary OAuth: a token exchange and a JWT bearer grant. No bespoke trust code, no secret shared between the agent and each SaaS vendor.',
  },
]

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is this the same thing as MCP authorization?',
    a: 'It sits underneath it. MCP says an MCP server is an OAuth protected resource and clients must present an access token — it does not say how an agent in one company’s trust domain gets a token another company’s authorization server will accept. That gap is what the chain in this demo fills.',
  },
  {
    q: 'Identity Chaining or Cross App Access — which one is real?',
    a: 'Both, and they are the same shape. Identity chaining is the general pattern for crossing trust domains. Cross App Access is the enterprise profile of it, where the IdP already federates both applications and issues an ID-JAG so admins manage app-to-app API access next to SSO. Toggle between them above and compare the requests.',
  },
  {
    q: 'Why not just give the agent an API key per app?',
    a: 'Because an API key has no user in it. It cannot be scoped per person, it does not expire, it survives offboarding, and the receiving app’s audit log can only record that "the integration" did something. Everything this demo shows follows from wanting the user’s identity to survive the hop.',
  },
  {
    q: 'Are these real tokens?',
    a: 'No. Every JWT here is generated in your browser and carries an inert placeholder where the signature belongs. The header and payload are genuinely base64url-encoded, so they decode exactly like the real thing — but nothing is signed, nothing is verified, and no request leaves this page.',
  },
]
