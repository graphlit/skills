# Quickstart

Use this reference for the fastest path from a new Graphlit account to a working project.

## On This Page

- Graphlit Studio onboarding
- SDK install
- environment variables
- connection verification
- running the example app
- common first-run issues

## 1. Create a Graphlit Project

If the developer does not already have Graphlit credentials:

1. Open [Graphlit Studio](https://www.graphlit.dev).
2. Create an account.
3. Create an organization.
4. Create a project.
5. Select that project in the Graphlit Studio sidebar so its project card is visible.
6. Choose the target environment tab, usually `Preview` or `Production`.
7. Click the copy button for `Copy Environment Variables`.

The Graphlit SDK needs these values:

- `GRAPHLIT_ORGANIZATION_ID`
- `GRAPHLIT_ENVIRONMENT_ID`
- `GRAPHLIT_JWT_SECRET`

For `streamAgent()` examples, the developer also needs an LLM provider key such as `OPENAI_API_KEY`.

## 2. Install the SDK

TypeScript setup:

```bash
npm install graphlit-client
npm install openai
```

`openai` is only required when the app uses `streamAgent()` with OpenAI-backed streaming.

## 3. Configure Environment Variables

Create `.env.local` or `.env`:

```env
GRAPHLIT_ORGANIZATION_ID=your_org_id
GRAPHLIT_ENVIRONMENT_ID=your_env_id
GRAPHLIT_JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
```

## 4. Verify the Connection

Start every new Graphlit integration by checking `getProject()`:

```typescript
import { Graphlit } from "graphlit-client";

const client = new Graphlit();

async function main() {
  const project = await client.getProject();
  console.log(`Connected to: ${project.project.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

What this proves:

- the Graphlit credentials are valid
- the SDK can reach the selected project
- the app is pointed at the intended project, not stale credentials

## 5. Optional: Verify Streaming Setup

If the developer is going straight to `streamAgent()`, also verify the provider key is present:

```typescript
import OpenAI from "openai";
import { Graphlit } from "graphlit-client";

const client = new Graphlit();
client.setOpenAIClient(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
);
```

The Graphlit SDK handles the Graphlit API credentials. Streaming still needs the provider client and provider key.

## 6. Run the Example App

When the repo example is available, use `examples/nextjs-streaming-chat`.

```bash
cd examples/nextjs-streaming-chat
npm install
cp .env.example .env.local
npm run check
npm run dev
```

Open `http://localhost:3000`.

## What Success Looks Like

- `getProject()` prints the selected Graphlit project name.
- The example app starts without Graphlit authentication errors.
- The app can ingest a public URL.
- The app waits for `isContentDone()` before chat depends on that content.
- The chat route can call `streamAgent()` and show retrieved sources.

## Common First-Run Issues

### Graphlit authentication fails

Usually means one of these:

- credentials were copied from the wrong project
- credentials were copied from the wrong environment tab
- one of the three `GRAPHLIT_*` values is missing
- `.env.local` was updated but the dev server was not restarted

### Streaming fails before the first token

Usually means:

- `OPENAI_API_KEY` is missing or invalid
- the OpenAI client was not attached with `setOpenAIClient(...)`
- the specification references a provider that is not configured in the environment

### The app connects, but chat seems empty

Usually means setup is fine, but content is not ready yet. Move to `references/ingestion.md` and make sure the app waits for `isContentDone()`.
