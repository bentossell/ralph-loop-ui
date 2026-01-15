# Ralph Loop UI

Built by [Droid](https://factory.ai)

Minimal task planner UI that reads GitHub issues and shows live loop status.

Related repo: https://github.com/bentossell/agent-loop

## Setup

1. Install deps:

```
npm install
```

2. Create `.env.local` with:

```
AGENT_LOOP_REPO="owner/repo"
AGENT_LOOP_TOKEN="<github_token_with_repo_scope>"
```

3. Run locally:

```
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Deploy on Vercel and set `AGENT_LOOP_REPO` + `AGENT_LOOP_TOKEN` as Environment Variables.
