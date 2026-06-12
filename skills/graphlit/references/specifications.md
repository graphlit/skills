# Specifications

Use this reference when the developer needs to choose, create, or reuse Graphlit model configurations.

## On This Page

- what specifications control
- agentic specifications for `streamAgent()`
- completion specifications for `promptConversation()`
- extraction specifications for workflows
- reusing existing specifications
- provider setup and good defaults

## What a Specification Does

A specification is a reusable model configuration.

For most Graphlit integrations, specifications matter in two places:

- **agentic specifications** for `streamAgent()`, tool calling, and streamed agent runs
- **completion specifications** for `promptConversation()` and other non-agent conversation calls
- **extraction specifications** for workflows such as knowledge graph extraction

## Agentic Specification for `streamAgent()`

This is the most common public pattern:

```typescript
import { Graphlit, Types } from "graphlit-client";

const client = new Graphlit();

const systemPrompt = [
  "You are a grounded assistant over a Graphlit knowledge base.",
  "Use the provided retrieval tools before answering questions that depend on project content.",
  "If retrieval returns weak or empty evidence, say so plainly.",
  "Cite document names naturally in the answer.",
].join(" ");

const upserted = await client.upsertSpecification({
  name: "Graphlit Grounded Agent",
  type: Types.SpecificationTypes.Agentic,
  serviceType: Types.ModelServiceTypes.OpenAi,
  systemPrompt,
  searchType: Types.ConversationSearchTypes.None,
  strategy: {
    enableSummarization: true,
    enableEntityExtraction: true,
    enableFactExtraction: false,
  },
  openAI: {
    model: Types.OpenAiModels.Gpt4O_128K,
    temperature: 0.2,
    completionTokenLimit: 1200,
  },
});

const specificationId = upserted.upsertSpecification?.id;
```

Use the resulting specification with `streamAgent()`:

```typescript
await client.streamAgent(
  prompt,
  onEvent,
  conversationId,
  { id: specificationId },
  tools,
  toolHandlers,
);
```

Good defaults for grounded chat:

- `SpecificationTypes.Agentic`
- `searchType: ConversationSearchTypes.None` when retrieval is handled explicitly through tools
- low temperature
- moderate response token limit
- one clear system prompt
- one clear provider
- upsert/reuse the same specification across the app

Use `SpecificationTypes.Completion` for `promptConversation()` style calls. Do not use Completion specs for `streamAgent()` tool-calling runs.

## Reuse Before Creating

If the app runs often, query for an existing specification first:

```typescript
async function ensureAgenticSpecification(
  client: Graphlit,
  name: string,
): Promise<string> {
  const existing = await client.querySpecifications({
    search: name,
    types: [Types.SpecificationTypes.Agentic],
  });

  const match =
    existing.specifications?.results?.find((spec) => spec?.name === name) ??
    existing.specifications?.results?.[0];

  if (match?.id) {
    return match.id;
  }

  const systemPrompt = [
    "You are a grounded assistant over a Graphlit knowledge base.",
    "Use the provided retrieval tools before answering questions that depend on project content.",
    "If retrieval returns weak or empty evidence, say so plainly.",
    "Cite document names naturally in the answer.",
  ].join(" ");

  const upserted = await client.upsertSpecification({
    name,
    type: Types.SpecificationTypes.Agentic,
    serviceType: Types.ModelServiceTypes.OpenAi,
    systemPrompt,
    searchType: Types.ConversationSearchTypes.None,
    strategy: {
      enableSummarization: true,
      enableEntityExtraction: true,
      enableFactExtraction: false,
    },
    openAI: {
      model: Types.OpenAiModels.Gpt4O_128K,
      temperature: 0.2,
      completionTokenLimit: 1200,
    },
  });

  const upsertedId = upserted.upsertSpecification?.id;
  if (!upsertedId) {
    throw new Error(`Failed to upsert specification: ${name}`);
  }

  return upsertedId;
}
```

This is the same shape used in the example app.

## Extraction Specification for Knowledge Graph Workflows

Knowledge graph extraction uses a different specification type:

```typescript
const extraction = await client.createSpecification({
  name: "Graphlit Entity Extraction",
  type: Types.SpecificationTypes.Extraction,
  serviceType: Types.ModelServiceTypes.OpenAi,
  openAI: {
    model: Types.OpenAiModels.Gpt5_400K,
    temperature: 0,
  },
});

const extractionSpecificationId = extraction.createSpecification?.id;
```

Use that specification inside a workflow:

```typescript
const workflow = await client.createWorkflow({
  name: "Entity Extraction Workflow",
  extraction: {
    jobs: [
      {
        connector: {
          type: Types.EntityExtractionServiceTypes.ModelText,
          modelText: {
            specification: { id: extractionSpecificationId },
            tokenThreshold: 32,
          },
          extractedTypes: [
            Types.ObservableTypes.Person,
            Types.ObservableTypes.Organization,
            Types.ObservableTypes.Place,
            Types.ObservableTypes.Event,
            Types.ObservableTypes.Product,
          ],
        },
      },
    ],
  },
});
```

## Provider Setup

Specifications choose the model provider, but the environment still needs the provider key or client.

For the example app in this repo:

- Graphlit project credentials come from Graphlit Studio
- `OPENAI_API_KEY` powers the OpenAI-backed `streamAgent()` path

If the developer switches providers, update both:

- the specification
- the runtime provider configuration

## Recommended Defaults

### Grounded chat

- `SpecificationTypes.Agentic`
- one shared spec per app
- explicit system prompt
- low temperature
- explicit token limit

### Prompt conversation

- `SpecificationTypes.Completion`
- use this for `promptConversation()`/`completeConversation()` paths, not `streamAgent()`

### Entity extraction

- `SpecificationTypes.Extraction`
- deterministic settings such as `temperature: 0`
- explicit extracted entity types

## Common Mistakes

### Using a completion spec for `streamAgent()`

`streamAgent()` is the agent/tool-calling path, so use `SpecificationTypes.Agentic`. Completion specs are for `promptConversation()` and related conversation-completion calls.

### Using a completion spec for extraction

Completion and extraction are separate specification types. Use `Extraction` in workflows.

### Creating a new specification every request

Most apps should query and reuse one named specification instead of creating duplicates continuously.

### Configuring the spec but not the provider runtime

If the spec uses OpenAI-backed streaming, the app still needs the OpenAI client and API key.
