# Feeds

Use this reference when the developer wants Graphlit to keep an external source synced automatically.

## On This Page

- when to use feeds instead of direct ingest
- feed lifecycle and sync modes
- `isFeedDone()` polling
- a canonical web crawl feed
- a canonical Slack feed
- scoping feeds with collections and workflows
- querying synced content

## When to Use Feeds

Use direct ingest when the app has one-off URLs, files, or raw text.

Use feeds when the app needs:

- backfill plus ongoing updates
- source-specific authentication
- repeated sync without manual re-ingest
- one integration that keeps a knowledge base fresh over time

Typical Graphlit feed use cases:

- Slack channels
- Google Drive folders
- Gmail or Outlook mailboxes
- S3 or cloud storage buckets
- RSS feeds
- website crawls

## How Feeds Behave

Create the feed once, then let Graphlit handle the sync lifecycle.

Two listing modes show up often:

- `Past`: backfill older items, then continue syncing new ones
- `New`: only sync items created after the feed is created

Two sync modes matter for lifecycle behavior:

- `Archive`: keep ingested content even if the source later removes it
- `Mirror`: keep Graphlit aligned with the source, including deletions

One important rule:

- `isFeedDone()` tells you when the initial sync is complete
- the feed can continue syncing new content after that

## Polling Helper for Initial Sync

```typescript
import { Graphlit } from "graphlit-client";

export async function waitForFeed(
  client: Graphlit,
  feedId: string,
  intervalMs = 10000,
  maxAttempts = 60,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await client.isFeedDone(feedId);
    if (status.isFeedDone?.result) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
```

Use this right after `createFeed()` when the app depends on the first sync being ready.

## Canonical Example: Web Crawl Feed

This is the strongest pattern when the developer wants a site that stays synced over time instead of a one-off `ingestUri()` call.

```typescript
import { Graphlit, Types } from "graphlit-client";

const client = new Graphlit();

const feed = await client.createFeed({
  name: "Company Documentation",
  type: Types.FeedTypes.Web,
  web: {
    uri: "https://docs.example.com",
    readLimit: 500,
    includeFiles: true,
    allowedDomains: ["docs.example.com"],
    excludedPaths: ["/archive/", "/login/"],
  },
  collections: collectionId ? [{ id: collectionId }] : undefined,
  workflow: workflowId ? { id: workflowId } : undefined,
});

const feedId = feed.createFeed?.id;
if (!feedId) {
  throw new Error("Graphlit did not return a feed id.");
}

const ready = await waitForFeed(client, feedId);
if (!ready) {
  throw new Error("Timed out waiting for the initial web crawl to finish.");
}

const pages = await client.queryContents({
  feeds: [{ id: feedId }],
  types: [Types.ContentTypes.Page],
});

console.log(`Synced ${pages.contents?.results?.length ?? 0} pages`);
```

Practical rules for web crawl feeds:

- always set `allowedDomains`
- set a realistic `readLimit`
- use `excludedPaths` or `allowedPaths` to keep the crawl focused
- turn on `includeFiles` when the site links to PDFs or docs you want in the knowledge base

## Canonical Example: Slack Feed

Use a Slack feed when the app should continuously sync channel history and new messages.

```typescript
import { Graphlit, Types } from "graphlit-client";

const client = new Graphlit();

const channels = await client.querySlackChannels({
  token: process.env.SLACK_TOKEN!,
});

console.log("Available channels:", channels.slackChannels?.results ?? []);

const feed = await client.createFeed({
  name: "Engineering Slack",
  type: Types.FeedTypes.Slack,
  slack: {
    type: Types.FeedListingTypes.Past,
    channel: "engineering",
    token: process.env.SLACK_TOKEN!,
    readLimit: 100,
    includeAttachments: true,
  },
  collections: collectionId ? [{ id: collectionId }] : undefined,
  workflow: workflowId ? { id: workflowId } : undefined,
});

const feedId = feed.createFeed?.id;
if (!feedId) {
  throw new Error("Graphlit did not return a feed id.");
}

const ready = await waitForFeed(client, feedId);
if (!ready) {
  throw new Error("Timed out waiting for the initial Slack sync to finish.");
}

const messages = await client.queryContents({
  feeds: [{ id: feedId }],
  types: [Types.ContentTypes.Message],
});

console.log(`Synced ${messages.contents?.results?.length ?? 0} messages`);
```

Practical rules for Slack feeds:

- one feed per channel is usually the clearest pattern
- use `Past` when the assistant needs historical context
- use `New` when only future activity matters
- include attachments when files in the channel matter to retrieval

## Scope Feeds with Collections and Workflows

Feeds become much more useful when they attach directly to the right processing pipeline:

```typescript
await client.createFeed({
  name: "Engineering Slack",
  type: Types.FeedTypes.Slack,
  slack: {
    type: Types.FeedListingTypes.Past,
    channel: "engineering",
    token: process.env.SLACK_TOKEN!,
    includeAttachments: true,
  },
  collections: [{ id: collectionId }],
  workflow: { id: workflowId },
});
```

Why this matters:

- the synced content lands in the right assistant scope
- the extraction or preparation workflow runs immediately
- the app does not need a second organization pass later

## Query Feeds and Synced Content

List feeds:

```typescript
const feeds = await client.queryFeeds({
  search: "Engineering",
});
```

Inspect a specific feed:

```typescript
const feed = await client.getFeed(feedId);
console.log(feed.feed?.name, feed.feed?.type, feed.feed?.state);
```

Search the content synced by one feed:

```typescript
const results = await client.queryContents({
  feeds: [{ id: feedId }],
  search: "deployment issues",
  searchType: Types.SearchTypes.Hybrid,
});
```

That is often the fastest way to validate that the feed is syncing the right material.

## Good Defaults

- direct ingest for demos and one-off content
- feeds for recurring external systems
- `Past` for most first-time syncs
- `Archive` when historical records should stay available
- a collection per assistant, customer, or dataset
- a workflow on the feed when extraction should happen automatically

## Common Mistakes

### Expecting immediate retrieval after `createFeed()`

The feed record exists right away, but the initial sync still needs `isFeedDone()`.

### Using a web feed without crawl boundaries

Always constrain web feeds with `allowedDomains`, `readLimit`, and path filters.

### Syncing the right source into the wrong scope

If the assistant is customer-specific or workspace-specific, attach the collection during feed creation instead of trying to untangle the content later.
