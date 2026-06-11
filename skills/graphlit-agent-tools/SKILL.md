---
name: graphlit-agent-tools
description: Use this skill when a developer wants to give an agent Graphlit retrieval and source tools with the @graphlit/agent-tools NPM package, especially to let the agent retrieve Graphlit-ingested content, inspect sources, search the web, ingest URLs, or wait for content readiness in any tool-calling agent framework without hand-writing common schemas and handlers.
---

# Graphlit Agent Tools

Use `@graphlit/agent-tools` when an agent needs Graphlit retrieval and source tools: search ingested content, inspect the sources behind an answer, bring in a URL when context is missing, and wait until new content is ready.

This skill is for application developers using the package. It is not for building the package, copying the built-in Graphlit MCP server, adding MCP tool discovery, creating approval middleware, or adding app-specific agent/view scope.

## What This Gives An Agent

- Retrieval over Graphlit-ingested documents, emails, events, messages, pages, posts, and files.
- Inspectable `contents://...` sources for grounded answers.
- Web search and URL ingestion when the agent needs fresh context.
- Content-readiness polling so newly ingested sources are not used too early.
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

| Import | Tool name | Use when |
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
- Do not treat `web_search` results as ingested evidence. Ingest or inspect URLs before relying on answer-critical facts.
- Wait for newly ingested content before expecting retrieval to find it.
- Keep system guidance short: call retrieval before grounded answers, inspect important sources, and be honest about weak evidence.
