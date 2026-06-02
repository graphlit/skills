# Ingestion

Use this reference when the developer needs to get content into Graphlit.

## On This Page

- choosing direct ingest vs feeds
- `ingestUri()` for websites and file URLs
- `ingestText()` for raw text
- `isContentDone()` polling
- attaching collections and workflows during ingest
- common ingestion mistakes

## Choose the Right Ingestion Path

Use direct SDK ingestion when:

- the app accepts a user-pasted website URL
- the app accepts a public file URL
- the app creates or imports small batches of raw text
- the app needs a simple first integration

Use feeds when:

- the source should stay synced over time
- the source already lives in Slack, Google Drive, email, RSS, S3, or another supported system
- the app needs backfill plus new updates

## Canonical Direct Ingestion Flow

1. Call `ingestUri()` or `ingestText()`.
2. Capture the returned `contentId`.
3. Poll `isContentDone(contentId)` until it succeeds.
4. Only then allow retrieval or grounded chat to depend on that content.

## Polling Helper

```typescript
import { Graphlit } from "graphlit-client";

export async function waitForContent(
  client: Graphlit,
  contentId: string,
  intervalMs = 5000,
  maxAttempts = 24,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await client.isContentDone(contentId);
    if (status.isContentDone?.result) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
```

`isContentDone()` is the key readiness gate for direct ingestion.

## Ingest a Website or Public File URL

```typescript
import { Graphlit } from "graphlit-client";

const client = new Graphlit();

const ingestResponse = await client.ingestUri(
  "https://example.com/guide.pdf",
  "Product Guide",
  undefined,
  undefined,
  false,
);

const contentId = ingestResponse.ingestUri?.id;
if (!contentId) {
  throw new Error("Graphlit did not return a content id.");
}

const ready = await waitForContent(client, contentId);
if (!ready) {
  throw new Error("Timed out waiting for Graphlit to finish processing content.");
}

const content = await client.getContent(contentId);
console.log(`Ready: ${content.content?.name ?? contentId}`);
```

Why this pattern works well:

- the request returns immediately
- the app owns the readiness state
- the UI can show progress or a pending state
- the next retrieval step only runs on processed content

## Attach a Collection During Ingest

If the app already knows the retrieval boundary, attach the collection immediately:

```typescript
await client.ingestUri(
  "https://example.com/guide.pdf",
  "Product Guide",
  undefined,
  undefined,
  false,
  undefined,
  [{ id: collectionId }],
);
```

That keeps ingestion and retrieval aligned from the start.

## Attach a Workflow During Ingest

If the app wants extraction or preparation to happen as part of ingest:

```typescript
await client.ingestUri(
  "https://example.com/guide.pdf",
  "Product Guide",
  undefined,
  undefined,
  false,
  { id: workflowId },
  collectionId ? [{ id: collectionId }] : undefined,
);
```

Use this when:

- content should enter a knowledge graph workflow immediately
- a feed or ingest should always apply the same processing pipeline
- the app wants one canonical ingest path instead of a retroactive processing step

## Ingest Raw Text

Use `ingestText()` when the source does not start as a file or URL:

```typescript
const ingestResponse = await client.ingestText(
  "Met with Sarah Chen from Acme Corp about the Q4 rollout.",
  "Meeting Note",
);

const contentId = ingestResponse.ingestText?.id;
if (!contentId) {
  throw new Error("Graphlit did not return a content id.");
}

const ready = await waitForContent(client, contentId);
console.log(`Content ready: ${ready}`);
```

Good uses for `ingestText()`:

- meeting notes
- chat transcripts
- CRM notes
- generated summaries
- application events that should become searchable context

## Synchronous Ingest vs Polling

Graphlit also supports synchronous ingest for simpler scripts:

```typescript
await client.ingestUri(
  "https://example.com/guide.pdf",
  "Product Guide",
  undefined,
  undefined,
  true,
);
```

Use synchronous ingest when:

- the script is short-lived
- the content is small
- a blocking workflow is acceptable

Prefer explicit polling in apps and server routes because it gives the developer control over timeouts, UI state, and retries.

## What to Persist in the App

Store enough information for the next retrieval step:

- `contentId`
- human-friendly content name
- `collectionId` when scoped
- `workflowId` when used
- readiness state from `isContentDone()`

## Common Ingestion Mistakes

### Treating ingest completion as retrieval readiness

Creating the content record is not the same thing as finishing processing. Always wait for `isContentDone()`.

### Ingesting into the wrong scope

If the app expects collection-scoped retrieval, ingest into that collection up front or add the content afterward before the first retrieval call.

### Adding a workflow later

Workflows are applied during ingest. If the developer wants extraction or preparation, pass the workflow during `ingestUri()` or `ingestText()`.
