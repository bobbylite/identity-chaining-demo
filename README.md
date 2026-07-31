# Cross-domain access, live

An interactive, fully-simulated walkthrough of **cross-domain access for AI agents**:
how an agent in one company's trust domain gets a credential that another company's
authorization server will accept, on behalf of a named user, without API keys, consent
pop-ups or a shared service account.

It covers both flavours of the same idea, on the identical scenario, switchable in the UI:

- **Identity Chaining** — [`draft-ietf-oauth-identity-chaining`](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/):
  RFC 8693 token exchange for an audience-restricted JWT authorization grant, then an
  RFC 7523 JWT bearer grant at the other domain's authorization server.
- **Cross App Access (ID-JAG)** — [`draft-ietf-oauth-identity-assertion-authz-grant`](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/):
  the enterprise profile, where the IdP that already runs SSO for both applications
  issues an Identity Assertion JWT Authorization Grant so admins manage app-to-app API
  access next to SSO.

## The scenario

Ryland asks Contoso's internal agent one question about a stuck renewal. Answering it
means reaching into four separate SaaS trust domains — Salesforce, Google Drive, Jira
and ServiceNow — each with its own authorization server and its own MCP server. The
agent holds no credential for any of them.

Every run is five steps: establish the user's identity, discover who guards the target
resource ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)), exchange at the IdP, cross
the trust boundary, call the MCP tool.

## What you can do with it

- **Step through the chain** for any of the four apps, with play/pause, speed control and
  `←` `→` `space` keyboard scrubbing.
- **Click anything monospaced.** Request parameters and JWT claims both explain
  themselves inline — what `aud` is holding up, why `act` matters, what `id-jag` requests.
- **Compare the two profiles** on the same scenario and diff the request bodies.
- **Break it on purpose.** Five failure conditions, and the chain stops at whichever party
  is actually responsible for catching that mistake:

  | Condition | Caught by | Control |
  | --- | --- | --- |
  | Assignment revoked | IdP | app-to-app assignment |
  | Scope escalation | IdP | scope entitlement check |
  | Replay in the wrong domain | Resource AS | audience restriction (`aud`) |
  | Expired grant | Resource AS | short lifetime (`exp`) |
  | Tampered payload | Resource AS | signature verification (JWKS) |

- **Flip the IdP's admin switches** and watch access die at the identity provider, without
  anyone touching the SaaS app.

## Everything here is simulated

There is no backend. No request leaves the page. Every JWT is generated in your browser
with a deterministic but **inert** placeholder where the signature belongs — the header
and payload really are base64url, so they decode exactly like the real thing, but nothing
is signed and nothing is verified. The "tampered payload" condition works by re-encoding
the payload while keeping the original signature segment, which is exactly what a holder
of a bearer token can do.

Company names, domains and data are fictional; every hostname uses the reserved
`.example` TLD.

## Stack

React + TypeScript + Vite. Static output only — no runtime dependencies beyond React,
no analytics, no cookies, no network calls. Light and dark themes follow the OS by
default and can be pinned from the header.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes `dist/` via GitHub Actions. To enable
it on a new repo:

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to "GitHub Actions".
3. Push to `main` — the workflow builds and deploys automatically.

`vite.config.ts` sets `base: '/identity-chaining-demo/'` for a project-page URL
(`https://<user>.github.io/identity-chaining-demo/`). If you fork or rename the repo,
update `base` to match (or set it to `'/'` for a user/org root page).

## Where the content lives

- `src/data/world.ts` — the cast: user, agent, IdP, and the four resource apps.
- `src/data/protocol.ts` — the engine. Runs are *computed* from app + profile + IdP policy
  + lab condition, so the HTTP bodies, token claims and failure point all follow from the
  controls rather than being scripted.
- `src/data/tokens.ts` — builds, decodes and tampers with the simulated JWTs.
- `src/data/glossary.ts` — the plain-language claim and parameter explanations.
- `src/data/story.ts` — the narrative framing: the before/after contrasts, payoffs and FAQ.
- `src/components/` — top bar, hero, walkthrough console, flow map, inspector, security lab.
