---
name: graphlit-agent-tools
description: Use this skill when a developer wants to install and use the @graphlit/agent-tools NPM package in a TypeScript app with the Graphlit SDK and streamAgent(), especially to add top-level retrieval, content inspection, web search, URL ingestion, or content-readiness tools without hand-writing common tool schemas, using MCP tool discovery, or copying the built-in MCP server/tool registry.
---

# Graphlit Agent Tools

Use `@graphlit/agent-tools` when a TypeScript app already uses `graphlit-client` and wants direct `streamAgent()` tools with low setup friction.

This skill is for application code. It is not for the built-in Graphlit MCP server, MCP tool discovery, approval middleware, UI routing, or agent/view-scoped tool registries.

## Install

```bash
npm install graphlit-client @graphlit/agent-tools
```

Run these tools server-side with Graphlit credentials. Do not expose Graphlit project credentials to the browser.

## Core Pattern

Import the tool factories the app needs, create them with the app's Graphlit client, then pass their `tool` definitions and `handler`s directly into `streamAgent()`.

```typescript
import { Graphlit } from "graphlit-client";
import {
  createInspectContentTool,
  createRetrieveContentsTool,
  createWebSearchTool,
} from "@graphlit/agent-tools";

const client = new Graphlit(
  process.env.GRAPHLIT_ORGANIZATION_ID!,
  process.env.GRAPHLIT_ENVIRONMENT_ID!,
  process.env.GRAPHLIT_JWT_SECRET!,
);

const retrieveContents = createRetrieveContentsTool(client);
const inspectContent = createInspectContentTool(client);
const webSearch = createWebSearchTool(client);

const selectedTools = [retrieveContents, inspectContent, webSearch];

await client.streamAgent(
  message,
  onEvent,
  conversationId,
  specification,
  selectedTools.map((item) => item.tool),
  Object.fromEntries(
    selectedTools.map((item) => [item.tool.name, item.handler]),
  ),
  {
    maxToolRounds: 8,
  },
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  [
    "Use retrieve_contents before answering questions that depend on ingested Graphlit content.",
    "Use inspect_content when a retrieved source needs fuller text before making a source-backed claim.",
    "If retrieved evidence is weak or missing, say so plainly.",
  ].join(" "),
);
```

Do not look for a package bundle helper. Import the individual factories the app needs and keep tool selection explicit in application code.

## Tool Selection

| Factory | Tool name | Use when |
| --- | --- | --- |
| `createRetrieveContentsTool()` | `retrieve_contents` | The agent needs RAG over already-ingested Graphlit content. |
| `createInspectContentTool()` | `inspect_content` | The agent needs fuller text for a `contents://...` result before making a grounded claim. |
| `createWebSearchTool()` | `web_search` | The agent needs current public web leads. Results are not ingested. |
| `createIngestUrlTool()` | `ingest_url` | The agent should save a public URL into Graphlit for later retrieval. |
| `createWaitContentDoneTool()` | `wait_content_done` | The agent or app needs to wait until an ingested content item is processed. |

Prefer `retrieve_contents` plus `inspect_content` as the default RAG pair for grounded chat. Add `web_search`, `ingest_url`, and `wait_content_done` only when the app workflow needs them.

## Retrieval Behavior

`retrieve_contents` has two paths:

- With `search`, it calls Graphlit retrieval APIs for semantic RAG and returns source snippets.
- Without `search`, it calls `queryContents()` for filter-only requests like recent emails, upcoming events, or all videos.

Use filter-only retrieval for requests such as "all emails in the last week":

```typescript
import { Types } from "graphlit-client";

await retrieveContents.handler({
  type: Types.ContentTypes.Email,
  inLast: "P7D",
  limit: 25,
});
```

Use searched retrieval when the prompt names a topic, phrase, account, issue, or question to ground:

```typescript
await retrieveContents.handler({
  search: "onboarding risk renewal blocker",
  type: Types.ContentTypes.Email,
  inLast: "P30D",
  limit: 10,
});
```

Use forward-looking filters for upcoming content:

```typescript
await retrieveContents.handler({
  type: Types.ContentTypes.Event,
  inNext: "P7D",
  limit: 20,
});
```

Returned results include `resourceUri` values such as `contents://abc123`. Use those with `inspect_content` for answer-critical text:

```typescript
await inspectContent.handler({
  resourceUri: "contents://abc123",
  mode: "markdown",
});
```

## SDK Types

Rely on `graphlit-client` types instead of duplicating Graphlit shapes.

Useful package options are SDK-typed, including:

- `Types.ContentFilter`
- `Types.EntityReferenceInput`
- `Types.RetrievalStrategyInput`
- `Types.RerankingStrategyInput`
- `Types.SearchServiceTypes`
- `Types.ContentTypes`
- `Types.FileTypes`

For tenant, workspace, customer, or dataset boundaries, pass a collection only when the application already has that boundary from request/auth state:

```typescript
const retrieveContents = createRetrieveContentsTool(client, {
  collections: requestCollections,
});
```

Avoid examples that require a hard-coded collection ID unless the surrounding app already resolved that ID.

## Rules

- Use `@graphlit/agent-tools` instead of hand-authoring common tool schemas for `streamAgent()`.
- Choose explicit tool factories in the application. Do not add tool discovery, meta-tools, or a new router around this package.
- Do not copy built-in MCP server scope, approval, profile, agent, view, or UI behavior into app-level usage.
- Do not treat `web_search` results as ingested evidence. Ingest or inspect URLs before relying on answer-critical facts.
- Wait for newly ingested content before expecting retrieval to find it.
- Keep system guidance short: call retrieval before grounded answers, inspect important sources, and be honest about weak evidence.
