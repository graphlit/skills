---
name: graphlit-agent-tools
description: Use this skill when a developer wants to give an agent Graphlit retrieval, resource reading, content mutation, enrichment, or media generation tools with the @graphlit/agent-tools NPM package in any tool-calling framework without hand-writing common schemas and handlers.
---

# Graphlit Agent Tools

Use `@graphlit/agent-tools` when an agent needs Graphlit-backed tools: retrieve ingested content, inspect/read returned resources, ingest new context, organize collections/feeds, use graph/fact/entity retrieval, enrich entities, or generate media through Graphlit.

This skill is for application developers using the package. It is not for building the package, copying the built-in Graphlit MCP server, adding MCP tool discovery, creating approval middleware, or adding app-specific agent/view scope.

## What This Gives An Agent

- Retrieval over Graphlit-ingested documents, emails, events, messages, pages, posts, memories, and files.
- Resource-shaped URIs such as `contents://...`, `collections://...`, `feeds://...`, `facts://...`, `conversations://...`, and `entities://...`, plus package-native `list_resources` and `read_resource` tools to dereference them.
- Web search, URL/text/link ingestion, page screenshots, web mapping, and one-time or scheduled web crawl feeds.
- Content and feed readiness polling so newly ingested or synced sources are not used too early.
- Collection, label, memory, enrichment, and media generation tools that apps can expose intentionally.
- Explicit app-level control over which Graphlit abilities the agent has.

## Install

```bash
npm install graphlit-client @graphlit/agent-tools
```

Run these tools server-side with Graphlit credentials. Do not expose Graphlit project credentials to the browser.

## Core Pattern

Import only the Graphlit tools the agent needs, create them with the app's Graphlit client, then adapt the returned shape to the agent framework.

```typescript
import { Graphlit } from "graphlit-client";
import {
  createInspectContentTool,
  createRetrieveContentsTool,
} from "@graphlit/agent-tools";

const client = new Graphlit(
  process.env.GRAPHLIT_ORGANIZATION_ID!,
  process.env.GRAPHLIT_ENVIRONMENT_ID!,
  process.env.GRAPHLIT_JWT_SECRET!,
);

const retrieveContents = createRetrieveContentsTool(client);
const inspectContent = createInspectContentTool(client);
```

Each created tool has:

- `inputSchema`: Zod object schema for frameworks like OpenAI Agents SDK and Mastra.
- `tool`: Graphlit `ToolDefinitionInput` with `name`, `description`, and JSON schema string.
- `handler(args, artifacts?, abortSignal?)`: async implementation that validates args and calls Graphlit.

Do not look for a package bundle helper. Import individual tools and keep tool selection explicit in application code.

## Framework Adapters

For Graphlit `streamAgent()`, pass `tool` definitions and a handler map:

```typescript
const selectedTools = [retrieveContents, inspectContent];

await client.streamAgent(
  message,
  onEvent,
  conversationId,
  specification,
  selectedTools.map((item) => item.tool),
  Object.fromEntries(
    selectedTools.map((item) => [item.tool.name, item.handler]),
  ),
  { maxToolRounds: 8 },
);
```

For Mastra, create a Mastra tool with the Graphlit name, description, Zod schema, and handler:

```typescript
import { createTool } from "@mastra/core/tools";

const mastraRetrieveContents = createTool({
  id: retrieveContents.tool.name,
  description:
    retrieveContents.tool.description ?? "Retrieve Graphlit content.",
  inputSchema: retrieveContents.inputSchema,
  execute: async (args, context) =>
    retrieveContents.handler(args, undefined, context?.abortSignal),
});
```

For OpenAI Agents SDK, create a function tool with the Graphlit name, description, Zod parameters, and handler. Graphlit's SDK already handles its own OpenAI Responses API use internally; this adapter only exposes Graphlit retrieval as an OpenAI Agents SDK tool.

```typescript
import { tool } from "@openai/agents";

const openaiRetrieveContents = tool({
  name: retrieveContents.tool.name,
  description:
    retrieveContents.tool.description ?? "Retrieve Graphlit content.",
  parameters: retrieveContents.inputSchema,
  async execute(args) {
    return retrieveContents.handler(args);
  },
});
```

For Claude Agent SDK custom tools, pass the Zod raw shape into `tool()` and return a Claude tool result:

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";

const claudeRetrieveContents = tool(
  retrieveContents.tool.name,
  retrieveContents.tool.description ?? "Retrieve Graphlit content.",
  retrieveContents.inputSchema.shape,
  async (args) => {
    const result = await retrieveContents.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
  { annotations: { readOnlyHint: true, openWorldHint: true } },
);
```

For Claude Managed Agents or other JSON Schema harnesses, use the Graphlit tool schema as JSON and run the handler when the harness emits a custom tool call:

```typescript
const customToolDefinition = {
  type: "custom" as const,
  name: retrieveContents.tool.name,
  description:
    retrieveContents.tool.description ?? "Retrieve Graphlit content.",
  input_schema: JSON.parse(retrieveContents.tool.schema),
};

const result = await retrieveContents.handler(customToolCall.input);
```

## Tool Selection

Prefer `retrieve_contents` plus `inspect_content` as the default RAG pair for grounded chat. Add resource, mutation, enrichment, and generation tools only when the app workflow needs them.

### Read-Only Tools

| Import | Tool name | Use when |
| --- | --- | --- |
| `createRetrieveContentsTool()` | `retrieve_contents` | The agent needs RAG over already-ingested Graphlit content. |
| `createInspectContentTool()` | `inspect_content` | The agent needs fuller text, parent/child references, range reads, or optional image descriptions for a `contents://...` result before making a grounded claim. |
| `createListResourcesTool()` | `list_resources` | The agent needs discoverable Graphlit resource URIs. |
| `createReadResourceTool()` | `read_resource` | The agent needs to dereference `contents://`, `collections://`, `feeds://`, `facts://`, `conversations://`, or `entities://` URIs. |
| `createCountContentsTool()` | `count_contents` | The agent needs counts for content filters. |
| `createQueryContentFacetsTool()` | `query_content_facets` | The agent needs content facet buckets. |
| `createRetrieveCommunicationsTool()` | `retrieve_communications` | The agent needs emails, events, messages, posts, issues, or pull requests by participant, domain, topic, and recency. |
| `createRetrieveConversationsTool()` | `retrieve_conversations` | The agent needs prior Graphlit conversation records. |
| `createRetrieveEntitiesTool()` | `retrieve_entities` | The agent needs graph entities relevant to a prompt. |
| `createRetrieveFactsTool()` | `retrieve_facts` | The agent needs Graphlit facts relevant to a prompt. |
| `createLookupEntityTool()` | `lookup_entity` | The agent needs one entity and its relationships by ID or fuzzy name. |
| `createExploreEntityTool()` | `explore_entity` | The agent needs a composed entity view with relationships, facts, contents, and conversations. |
| `createRetrieveImagesTool()` | `retrieve_images` | The agent needs image content and optionally Base64 image bytes. |
| `createRetrieveMemoriesTool()` | `retrieve_memories` | The agent needs memory content; the tool locks content type to `MEMORY`. |
| `createQueryCollectionsTool()` | `query_collections` | The agent needs to list collections. |
| `createQueryFeedsTool()` | `query_feeds` | The agent needs to list feeds. |
| `createWebSearchTool()` | `web_search` | The agent needs current public web leads. Results are not ingested. |
| `createWebMapTool()` | `web_map` | The agent needs discovered URLs from a public website without ingestion. |

### Mutating Graphlit Tools

Expose these only when the host app wants the agent to mutate Graphlit project state. Approval, UI policy, and auth remain app responsibilities.

| Import | Tool name | Use when |
| --- | --- | --- |
| `createIngestUrlTool()` | `ingest_url` | The agent should save a public URL into Graphlit for later retrieval. |
| `createIngestTextTool()` | `ingest_text` | The agent should save raw text into Graphlit. |
| `createIngestLinksTool()` | `ingest_links` | The agent should ingest public hyperlinks extracted from existing Graphlit content. |
| `createScreenshotPageTool()` | `screenshot_page` | The agent should capture a public web page screenshot into Graphlit. |
| `createCreateCollectionTool()` | `create_collection` | The agent should create a collection. |
| `createAddContentsToCollectionTool()` | `add_contents_to_collection` | The agent should add content IDs to collections. |
| `createRemoveContentsFromCollectionTool()` | `remove_contents_from_collection` | The agent should remove content IDs from one collection. |
| `createDeleteCollectionTool()` | `delete_collection` | The agent should delete a collection by ID or URI. |
| `createAddContentLabelTool()` | `add_content_label` | The agent should add one label to one content item. |
| `createRemoveContentLabelTool()` | `remove_content_label` | The agent should remove one label from one content item. |
| `createWebCrawlTool()` | `web_crawl` | The agent should create a Graphlit web crawl feed. It defaults to a one-time crawl unless a schedule is provided. |
| `createWaitContentDoneTool()` | `wait_content_done` | The agent or app needs to wait until an ingested content item is processed. |
| `createWaitFeedDoneTool()` | `wait_feed_done` | The agent or app needs to wait until a feed sync is processed. |
| `createIngestMemoryTool()` | `ingest_memory` | The agent should store memory content. The public schema does not expose TTL. |
| `createDeleteMemoryTool()` | `delete_memory` | The agent should delete memory content after verifying `ContentTypes.Memory`. |

### Enrichment And Generation Tools

Availability depends on the Graphlit project capabilities, connectors, and credits.

| Import | Tool name | Use when |
| --- | --- | --- |
| `createEnrichCompaniesTool()` | `enrich_companies` | The agent should lookup company candidates and optionally create/enrich organization entities. |
| `createEnrichPersonsTool()` | `enrich_persons` | The agent should lookup person candidates and optionally create/enrich person entities. |
| `createPublishAudioTool()` | `publish_audio` | The agent should generate audio content from text. |
| `createPublishImageTool()` | `publish_image` | The agent should generate image content from a prompt. |
| `createPublishVideoTool()` | `publish_video` | The agent should generate video content from a prompt. |

Do not import broad `inspect`, delivery tools such as `draft_email` or `send_email`, prompt analysis, code/shell execution, or first-party orchestration helpers from this package. They are not part of the public package surface.

## Resource URI Behavior

Many tools return `resourceUri` values. The package intentionally returns resource-shaped URIs because they are stable agent handles, but every public scheme should have an app-free reader path:

- Use `inspect_content` for `contents://...` when the agent needs source text, export range reads, parent/child content references, or image descriptions.
- Use `read_resource` for generic dereferencing of `contents://...`, `collections://...`, `feeds://...`, `facts://...`, `conversations://...`, and `entities://...`.
- Use `list_resources` when the agent needs to discover available Graphlit resources by kind.
- Do not expect `read_resource` to read `https://`, `skills://`, `ui://`, or app-specific resources.
- For feeds, `read_resource` should return sanitized feed metadata and related contents, not raw connector-shaped auth fields.

## Retrieval Behavior

`retrieve_contents` has two paths:

- With `search`, it calls Graphlit retrieval APIs for semantic RAG and returns source snippets.
- Without `search`, it calls `queryContents()` for filter-only requests like recent emails, upcoming events, or all videos.

Use filter-only retrieval for requests such as "all emails in the last week":

```typescript
await retrieveContents.handler({
  type: "EMAIL",
  inLast: "P7D",
  limit: 25,
});
```

Use searched retrieval when the prompt names a topic, phrase, account, issue, or question to ground:

```typescript
await retrieveContents.handler({
  search: "onboarding risk renewal blocker",
  type: "EMAIL",
  inLast: "P30D",
  limit: 10,
});
```

Use forward-looking filters for upcoming content:

```typescript
await retrieveContents.handler({
  type: "EVENT",
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

For non-content resources, use `read_resource`:

```typescript
const readResource = createReadResourceTool(client);

await readResource.handler({
  uri: "facts://fact-id",
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

- Describe this package as Graphlit retrieval and source tools for agents.
- Say "agents" without qualifying them by implementation language.
- Treat `streamAgent()` as one compatible harness, not the reason the package exists.
- Choose explicit Graphlit tools in the application. Do not add package-level bundle helpers, tool discovery, meta-tools, or a new router around this package.
- Do not copy built-in MCP server scope, approval, profile, agent, view, or UI behavior into app-level usage.
- Do not expose `platform__list_resources` or `platform__read_resource`; use package-native `list_resources` and `read_resource` when generic Graphlit resource reading is useful.
- Do not treat `web_search` results as ingested evidence. Ingest or inspect URLs before relying on answer-critical facts.
- Wait for newly ingested content before expecting retrieval to find it.
- Keep system guidance short: call retrieval before grounded answers, inspect important sources, and be honest about weak evidence.
