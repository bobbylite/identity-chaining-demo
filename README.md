# Identity Chaining, Live

An interactive, fully-simulated walkthrough of **Figure 1** from
[`draft-ietf-oauth-identity-chaining`](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/) —
the OAuth Identity and Authorization Chaining flow.

The demo frames the spec's abstract "Trust Domain A / Trust Domain B" flow as a
concrete, timely scenario: an AI agent with MCP tool access needs to act on a
user's behalf inside two external SaaS platforms — **Salesforce** and
**ServiceNow** — each its own trust domain. Before every tool call, the app
runs the full six-step chain live in the browser:

1. Discover the target's authorization server
2. Exchange the user's token for a JWT authorization grant (RFC 8693 Token Exchange)
3. Receive the audience-restricted grant
4. Present the grant to the target's authorization server (RFC 7523 JWT Bearer Grant)
5. Receive a scoped access token
6. Call the protected resource (the MCP tool)

Every HTTP request/response and every JWT shown is generated and decoded
entirely client-side — **there is no backend**. Tokens are structurally real
JWTs (base64url header/payload) but carry an inert, non-cryptographic
signature, and are clearly labeled as simulated throughout the UI.

## Stack

React + TypeScript + Vite + Framer Motion. Static output only — safe for
GitHub Pages.

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

`.github/workflows/deploy.yml` builds and publishes `dist/` via GitHub Actions
on every push to `main`. To enable it on a new repo:

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to "GitHub Actions".
3. Push to `main` — the workflow builds and deploys automatically.

`vite.config.ts` sets `base: '/identity-chaining-demo/'` for a project-page
URL (`https://<user>.github.io/identity-chaining-demo/`). If you fork/rename
the repo, update `base` to match the new repo name (or set it to `'/'` if
deploying to a user/org root page).

## Where the content lives

- `src/data/scenario.ts` — the full 12-step scripted narrative: entities,
  per-step HTTP requests/responses, narration text, and verbatim spec quotes.
- `src/data/tokens.ts` — builds and decodes the simulated JWTs.
- `src/components/` — the flow diagram, chat panel, network/token viewers,
  timeline, and spec-comparison modal.
