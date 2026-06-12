# Streaming Chat

Use this reference when the developer needs the canonical modern Graphlit chat pattern.

## On This Page

- what `streamAgent()` does
- why retrieval should stay explicit
- a standalone `retrieve_contents` tool
- a server route pattern for NDJSON streaming
- event handling and source rendering
- common mistakes

## The Core Rule

`streamAgent()` is the streaming and tool-calling harness. It does not retrieve project content on its own.

For grounded chat, the app should:

1. ingest content or sync it through feeds
2. wait until that content is processed
3. give `streamAgent()` an explicit retrieval tool backed by Graphlit retrieval APIs
4. render the retrieved evidence alongside the streamed answer

## Why Keep Retrieval Explicit

This pattern is strong for public developer examples because it makes the system easy to understand:

- Graphlit stores and retrieves the knowledge
- `streamAgent()` runs the chat loop
- the retrieval tool makes evidence visible and inspectable
- the UI can show both answer text and supporting sources

## Tool Schema

Start with one retrieval tool:

```typescript
const retrieveContentsTool: Types.ToolDefinitionInput = {
  name: "retrieve_contents",
  description:
    "Retrieve relevant content from Graphlit before answering questions about project knowledge, documents, notes, pages, transcripts, or synced sources.",
  schema: JSON.stringify({
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to search for in Graphlit.",
      },
      limit: {
        type: "number",
        description: "Maximum number of matches to retrieve. Defaults to 6.",
      },
    },
    required: ["query"],
  }),
};
```

Use `references/retrieval.md` for the tool handler.

## Suggested System Guidance

Keep the system guidance short and directional:

- rely only on already processed Graphlit content
- call `retrieve_contents` before answering project-content questions
- say plainly when evidence is weak or missing
- cite document names naturally in the answer

Example:

```typescript
const systemPrompt = [
  "You are a grounded assistant over a Graphlit knowledge base.",
  "Only rely on content that has already been ingested and processed in Graphlit.",
  "Use retrieve_contents before answering questions that depend on project content.",
  "If retrieve_contents returns weak or empty evidence, say so plainly.",
  "Cite document names naturally in the answer.",
].join(" ");
```

## Canonical Server Route

This is the core pattern used in the example app:

The `specificationId` should reference a `SpecificationTypes.Agentic` specification. Use Completion specifications for `promptConversation()` style calls, not for this `streamAgent()` path.

```typescript
import OpenAI from "openai";
import { Graphlit, Types, type AgentStreamEvent } from "graphlit-client";

const client = new Graphlit();
client.setOpenAIClient(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
);

const specification = { id: specificationId };
const { tools, toolHandlers } = createRetrieveContentsTool(client, {
  collectionId,
  defaultLimit: 6,
});

await client.streamAgent(
  message,
  (event: AgentStreamEvent) => {
    switch (event.type) {
      case "conversation_started":
        write({
          type: "conversation_started",
          conversationId: event.conversationId,
        });
        break;
      case "tool_update":
        write({
          type: "tool_update",
          name: event.toolCall.name,
          status: event.status,
          result: event.result ?? null,
        });
        break;
      case "message_update":
        if (event.message.isThinking) {
          return;
        }

        write({
          type: "message_update",
          message: event.message.message ?? "",
          isStreaming: event.isStreaming,
        });
        break;
      case "error":
        write({
          type: "error",
          message: event.error.message,
        });
        break;
    }
  },
  conversationId,
  specification,
  tools,
  toolHandlers,
  {
    chunkingStrategy: "word",
    useResponsesApi: true,
  },
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  systemPrompt,
);
```

Important pieces:

- provider client is attached before streaming
- specification is explicit and points to an Agentic spec
- tools and handlers are passed directly into `streamAgent()`
- the callback maps agent events into UI-safe events

## Recommended Event Types for the Client

Expose at least these event types from the server:

- `conversation_started`
- `tool_update`
- `message_update`
- `error`
- `done`

That is enough for a good developer-facing demo:

- the user sees the answer streaming
- the user can tell when retrieval happened
- the user can inspect the returned sources

## What Success Looks Like

- the app ingests or syncs content first
- the app waits for processing readiness before grounded chat depends on new content
- the model calls `retrieve_contents` for knowledge questions
- the answer streams incrementally
- the UI shows retrieved sources alongside the answer

## Common Mistakes

### Using a completion specification

`streamAgent()` should use a `SpecificationTypes.Agentic` specification. Completion specifications are for `promptConversation()` and related non-agent conversation calls.

### Treating `streamAgent()` as the retrieval layer

`streamAgent()` is the harness. Grounding still comes from the retrieval tool the app provides.

### Streaming before content is ready

If the user ingests a new URL and immediately asks a question, the app still needs `isContentDone()` to succeed before retrieval is reliable.

### Hiding tool results from the UI

The strongest Graphlit examples show retrieval, not just final text. Surface source names and snippets so developers can trust the behavior they are copying.
