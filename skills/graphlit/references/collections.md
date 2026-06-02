# Collections

Use this reference when the developer needs a clear content boundary in Graphlit.

## On This Page

- when to create collections
- creating or reusing a collection
- adding content during or after ingest
- using collections in retrieval and feeds
- common scoping patterns

## What Collections Are For

Collections are the easiest way to keep ingestion and retrieval aligned around one dataset.

Common patterns:

- one collection per customer
- one collection per workspace
- one collection per assistant
- one collection per imported document set
- one temporary collection per research session

If the app has a known boundary, use a collection.

## Create a Collection

```typescript
const created = await client.createCollection({
  name: "Product Docs",
  description: "Documentation used by the support assistant",
});

const collectionId = created.createCollection?.id;
```

## Reuse an Existing Collection

This pattern keeps the app from creating duplicates:

```typescript
async function ensureCollection(
  client: Graphlit,
  name: string,
): Promise<string> {
  const existing = await client.queryCollections({ name });

  const match =
    existing.collections?.results?.find((collection) => collection?.name === name) ??
    existing.collections?.results?.[0];

  if (match?.id) {
    return match.id;
  }

  const created = await client.createCollection({ name });
  const createdId = created.createCollection?.id;

  if (!createdId) {
    throw new Error(`Failed to create collection: ${name}`);
  }

  return createdId;
}
```

## Add Content During Ingest

This is the cleanest path when the scope is already known:

```typescript
await client.ingestUri(
  "https://example.com/docs.pdf",
  "Docs",
  undefined,
  undefined,
  false,
  undefined,
  [{ id: collectionId }],
);
```

## Add Content After Ingest

If content already exists, add it afterward:

```typescript
await client.addContentsToCollections(
  [{ id: contentId }],
  [{ id: collectionId }],
);
```

Use this when:

- the content was ingested before the boundary existed
- the app is reorganizing existing content
- the user wants to move content into a new assistant scope

## Use Collections in Retrieval

Keep the same boundary on the retrieval side:

```typescript
const results = await client.retrieveSources(
  "pricing concerns",
  {
    searchType: Types.SearchTypes.Hybrid,
    collections: [{ id: collectionId }],
  },
);
```

Or, for content browsing:

```typescript
const results = await client.queryContents({
  collections: [{ id: collectionId }],
});
```

## Use Collections in Feeds

Feeds can add synced content into a collection automatically:

```typescript
await client.createFeed({
  name: "Engineering Slack",
  type: Types.FeedTypes.Slack,
  slack: {
    type: Types.FeedListingTypes.Past,
    channel: "engineering",
    token: process.env.SLACK_TOKEN!,
  },
  collections: [{ id: collectionId }],
});
```

That is usually better than syncing first and reorganizing later.

## Recommended Scoping Rules

- If the app serves multiple customers, use at least one collection per customer.
- If the app has separate datasets with different retrieval expectations, split them into collections.
- If the app is a one-off personal tool over a single dataset, one collection is often enough.
- If the app already has a workspace, project, or tenant ID, map it directly to a Graphlit collection.

## Common Mistakes

### Ingesting into one scope and retrieving from another

If retrieval looks empty, confirm the content was actually added to the expected collection.

### Creating a new collection every request

Collections are usually longer-lived than individual chats. Reuse them unless the app truly needs ephemeral isolation.

### Forgetting to scope feeds

If synced content is meant for one assistant or customer, attach the collection at feed creation time.
