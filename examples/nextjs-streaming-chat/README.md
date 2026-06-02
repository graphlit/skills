# Graphlit Next.js Streaming Chat

Minimal Next.js example for the modern Graphlit path:

- ingest a public website URL or public file URL into Graphlit
- poll `isContentDone()` until the content is fully processed
- `streamAgent()` as the streaming harness
- one standalone `retrieve_contents` tool
- retrieval powered by `retrieveSources()` and `lookupContents()`
- optional collection scoping through `GRAPHLIT_COLLECTION_ID`

This example keeps retrieval intentionally simple so you can clearly see how ingestion, retrieval, and `streamAgent()` work together.

## Run

```bash
npm install
cp .env.example .env.local
npm run check
npm run dev
```

Open `http://localhost:3000`.

## New To Graphlit?

If you do not already have a Graphlit project:

1. Go to [Graphlit Studio](https://www.graphlit.dev) and create a free account.
2. Create your organization.
3. Create your first project.
4. Open Graphlit Studio and select that project in the sidebar.
5. Copy the project credentials to your clipboard from the selected project.
6. Paste them into `.env.local`.

You also need an `OPENAI_API_KEY`.

## Required Environment Variables

- `GRAPHLIT_ORGANIZATION_ID`
- `GRAPHLIT_ENVIRONMENT_ID`
- `GRAPHLIT_JWT_SECRET`
- `OPENAI_API_KEY`

## Where the Graphlit credentials come from

1. Open Graphlit Studio.
2. Select your project in the Studio sidebar.
3. Copy the project credentials to your clipboard from the selected project in the sidebar.
4. Paste those values into `.env.local`.

`OPENAI_API_KEY` still comes from your OpenAI account.

## What the sample proves

- `streamAgent()` is the agent loop and streaming harness
- retrieval remains explicit through a standalone `retrieve_contents` tool
- content has to finish processing before retrieval becomes reliable
- a small app can make retrieval visible and inspectable without much extra code

## Optional Environment Variables

- `GRAPHLIT_COLLECTION_ID`
  Use this to keep retrieval scoped to one known collection.

- `GRAPHLIT_SPECIFICATION_ID`
  Use this if you already have a Graphlit specification you want the sample to reuse.

## What It Shows

1. A chat page sends user messages to a server route.
2. A separate route ingests a public website URL or public file URL into Graphlit and polls `isContentDone()`.
3. The chat route calls `streamAgent()`.
4. The route injects a standalone `retrieve_contents` tool.
5. The tool uses Graphlit retrieval APIs to fetch relevant sources.
6. Tool results are surfaced back to the UI alongside the streamed answer.

## Sample flow

1. Paste a public website URL or public file URL.
2. The app ingests it with `ingestUri()` and polls `isContentDone()`.
3. Once the content is ready, ask a question in chat.
4. The agent uses `retrieve_contents` before answering.
5. The UI shows both the streamed answer and the retrieved source snippets.

## Notes

- This example uses URL ingestion on purpose to keep setup simple.
- If you already have a collection with content, set `GRAPHLIT_COLLECTION_ID` and reuse it.
- The sample auto-creates a collection and a completion specification if you do not provide IDs.

## Troubleshooting

- If the assistant answers without useful sources, make sure the content finished processing and the UI reached a ready state after polling `isContentDone()`.
- If ingestion succeeds but chat cannot find the content, verify that the sample is using the expected collection scope.
- If Graphlit calls fail early, refresh the project credentials from the selected Studio project and update `.env.local`.
- If you want a quick confidence check before running the app, use `npm run check`.
