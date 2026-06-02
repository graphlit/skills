# Retrieval

Use this reference when the developer needs grounded retrieval over Graphlit content.

## On This Page

- `retrieveSources()` vs `queryContents()`
- collection-scoped retrieval
- `lookupContents()` for stable source names
- shaping tool-friendly results
- retrieval quality rules

## Choose the Right Retrieval API

Use `retrieveSources()` when:

- the model needs grounded evidence before answering
- the app is building a retrieval tool for `streamAgent()`
- the app wants ranked sections or snippets instead of whole content records

Use `queryContents()` when:

- the UI is browsing or searching content records
- the app needs a content list, not answer evidence
- the developer is building admin tools or dashboards

That distinction matters:

- `retrieveSources()` is for answer grounding
- `queryContents()` is for content search and management

## Canonical Grounding Pattern

1. Build a `ContentFilter`.
2. Scope it to a collection when the app has a known dataset boundary.
3. Call `retrieveSources()` for ranked snippets.
4. Call `lookupContents()` so the UI can render stable content names.
5. Return compact source objects to both the model and the UI.

## Retrieval Helper

```typescript
import { Graphlit, Types } from "graphlit-client";

type RetrievedSource = {
  id: string;
  name: string;
  text: string;
  relevance: number | null;
  pageNumber: number | null;
  startTime: number | null;
  endTime: number | null;
};

function truncateText(text: string | null | undefined, maxLength = 900): string {
  const value = text?.trim() ?? "";
  if (!value) {
    return "";
  }

  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

export async function retrieveContents(
  client: Graphlit,
  query: string,
  collectionId?: string,
  limit = 6,
): Promise<RetrievedSource[]> {
  const filter: Types.ContentFilter = {
    searchType: Types.SearchTypes.Hybrid,
    disableInheritance: true,
    collections: collectionId ? [{ id: collectionId }] : undefined,
  };

  const retrieved = await client.retrieveSources(
    query,
    filter,
    undefined,
    {
      type: Types.RetrievalStrategyTypes.Section,
      contentLimit: limit,
      disableFallback: true,
    },
    {
      serviceType: Types.RerankingModelServiceTypes.Cohere,
    },
  );

  const rawSources =
    retrieved.retrieveSources?.results?.filter(
      (source): source is NonNullable<typeof source> => Boolean(source?.content?.id),
    ) ?? [];

  const contentIds = [...new Set(rawSources.map((source) => source.content!.id!))];
  const lookup =
    contentIds.length > 0 ? await client.lookupContents(contentIds) : undefined;

  const contentMap = new Map(
    (lookup?.lookupContents?.results ?? [])
      .filter((content): content is NonNullable<typeof content> => Boolean(content?.id))
      .map((content) => [content.id, content]),
  );

  return rawSources
    .map((source) => {
      const content = contentMap.get(source.content!.id!);
      if (!content) {
        return null;
      }

      return {
        id: content.id,
        name: content.fileName || content.name || "Untitled content",
        text: truncateText(source.text),
        relevance: source.relevance ?? null,
        pageNumber: source.pageNumber ?? null,
        startTime: source.startTime ?? null,
        endTime: source.endTime ?? null,
      };
    })
    .filter((source): source is RetrievedSource => source !== null);
}
```

This is the canonical external Graphlit pattern for a standalone retrieval tool.

## What a Good Tool Result Looks Like

A retrieval tool should return compact, inspectable results:

```json
{
  "query": "pricing concerns",
  "collectionId": "collection-id",
  "results": [
    {
      "id": "content-id",
      "name": "Q4 Account Notes",
      "text": "The customer said pricing became a blocker for rollout...",
      "relevance": 0.93,
      "pageNumber": null,
      "startTime": null,
      "endTime": null
    }
  ]
}
```

That shape works well for:

- `streamAgent()` tool results
- visible source panels in the UI
- retrieval debugging
- server logs when developers need to inspect ranking quality

## Collection Scoping

If the app has a known content boundary, include it in the filter:

```typescript
const filter: Types.ContentFilter = {
  collections: [{ id: collectionId }],
  searchType: Types.SearchTypes.Hybrid,
};
```

Good examples:

- one customer per collection
- one workspace per collection
- one assistant per dataset
- one temporary research session per collection

## `queryContents()` for Search UIs

For a browsing UI, use `queryContents()` instead of `retrieveSources()`:

```typescript
const results = await client.queryContents({
  search: "pricing concerns",
  searchType: Types.SearchTypes.Hybrid,
  collections: collectionId ? [{ id: collectionId }] : undefined,
});
```

This gives content-centric results instead of answer-centric snippets.

## Retrieval Quality Rules

- Wait for `isContentDone()` before retrieving from newly ingested content.
- Wait for `isFeedDone()` before expecting a new feed’s initial sync to be fully available.
- Scope to collections when the boundary is known.
- Return enough text for the model to ground its answer.
- Surface sources to the user instead of hiding them.

## Common Retrieval Issues

### The model answers without using evidence

The retrieval tool may exist, but the system guidance is too weak. In `streamAgent()`, explicitly instruct the model to call the retrieval tool before answering content-dependent questions.

### Retrieval returns empty or weak results

Check:

- the content finished processing
- the app is using the expected collection
- the query is specific enough
- the source type really exists in the current project

### The answer cites vague document names

Use `lookupContents()` so the tool result carries stable names instead of only snippet fragments.
