# Knowledge Graph

Use this reference when the developer needs entities, relationships, or graph-aware retrieval on top of Graphlit content.

## On This Page

- what the Graphlit knowledge graph adds
- extraction specifications and workflows
- ingesting content into an extraction workflow
- querying observables
- querying a content graph
- filtering content by extracted entities

## What the Knowledge Graph Adds

Graphlit can extract structured entities from unstructured content, including:

- people
- organizations
- places
- events
- products
- software and repositories

That lets the app move beyond plain snippet retrieval into questions like:

- Who from Acme Corp have we talked to?
- Which documents mention both Sarah Chen and Salesforce?
- What meetings referenced the same organization across sources?

## The Core Rule

Knowledge graph extraction is not automatic by default. The app needs a workflow with an extraction stage, and that workflow must be applied during ingest or feed sync.

## Step 1: Create an Extraction Specification

```typescript
import { Graphlit, Types } from "graphlit-client";

const client = new Graphlit();

const extraction = await client.createSpecification({
  name: "Knowledge Graph Extraction",
  type: Types.SpecificationTypes.Extraction,
  serviceType: Types.ModelServiceTypes.OpenAi,
  openAI: {
    model: Types.OpenAiModels.Gpt5_400K,
    temperature: 0,
  },
});

const extractionSpecificationId = extraction.createSpecification?.id;
if (!extractionSpecificationId) {
  throw new Error("Failed to create extraction specification.");
}
```

Deterministic settings such as `temperature: 0` are a strong default for extraction.

## Step 2: Create a Workflow

```typescript
const workflow = await client.createWorkflow({
  name: "Entity Extraction Workflow",
  preparation: {
    jobs: [
      {
        connector: {
          type: Types.FilePreparationServiceTypes.Document,
        },
      },
    ],
  },
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
            Types.ObservableTypes.Software,
            Types.ObservableTypes.Repo,
          ],
        },
      },
    ],
  },
});

const workflowId = workflow.createWorkflow?.id;
if (!workflowId) {
  throw new Error("Failed to create workflow.");
}
```

## Step 3: Ingest Content Through the Workflow

```typescript
const content = await client.ingestText(
  `
  Met with Sarah Chen, CTO at Acme Corp, at their San Francisco office.
  She is evaluating our API for an enterprise rollout and mentioned Salesforce.
  Follow-up technical demo is scheduled for next Tuesday.
  `,
  "Sales Call Notes",
  undefined,
  undefined,
  undefined,
  undefined,
  true,
  { id: workflowId },
);

const contentId = content.ingestText?.id;
if (!contentId) {
  throw new Error("Failed to ingest content.");
}
```

The same pattern works with `ingestUri()` and feed creation.

## Step 4: Query Extracted Entities

```typescript
const observables = await client.queryObservables();
const results = observables.observables?.results ?? [];

const people = results.filter(
  (entry) => entry?.type === Types.ObservableTypes.Person,
);

const organizations = results.filter(
  (entry) => entry?.type === Types.ObservableTypes.Organization,
);

console.log("People:", people.map((entry) => entry?.observable.name));
console.log(
  "Organizations:",
  organizations.map((entry) => entry?.observable.name),
);
```

Use `queryObservables()` when the app wants:

- all extracted entities of a certain type
- a search box over people, organizations, or topics
- entity pickers for graph-aware filtering

## Step 5: Query the Graph for One Content Item

```typescript
const graph = await client.queryContentsGraph({
  contents: [{ id: contentId }],
});

const nodes = (graph.contents?.graph?.nodes ?? []).filter(
  (node): node is NonNullable<typeof node> => Boolean(node),
);
const edges = (graph.contents?.graph?.edges ?? []).filter(
  (edge): edge is NonNullable<typeof edge> => Boolean(edge),
);

const nodeById = new Map(nodes.map((node) => [node.id, node]));

for (const edge of edges) {
  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  if (!from || !to) {
    continue;
  }

  const relation = edge.relation ? ` --${edge.relation}--> ` : " --> ";
  console.log(`${from.name}${relation}${to.name}`);
}
```

This is the fastest way to show a developer that Graphlit extracted more than text snippets.

## Filter Content by Extracted Entity

Once entities exist, the app can filter content by those entities:

```typescript
const people = await client.queryObservables({
  search: "Sarah Chen",
  filter: {
    types: [Types.ObservableTypes.Person],
  },
});

const personId = people.observables?.results?.[0]?.observable.id;
if (!personId) {
  throw new Error("Person entity not found.");
}

const relatedContent = await client.queryContents({
  observations: [
    {
      type: Types.ObservableTypes.Person,
      observable: { id: personId },
    },
  ],
});
```

This is useful for:

- entity-centric navigation
- finding every content item mentioning a person or organization
- combining graph filters with retrieval or UI search

## Strong Usage Patterns

- apply the workflow during ingest or feed creation
- query observables for entity pickers and discovery UIs
- use `queryContentsGraph()` when the app needs relationship visibility
- combine graph filters with collections to keep entity search scoped correctly

## Common Mistakes

### Creating the workflow but not using it during ingest

The workflow has to be passed during `ingestUri()`, `ingestText()`, or feed creation.

### Expecting graph results on content that was ingested before the workflow existed

Extraction is tied to the processing path. If the content was ingested without the workflow, reingest or resync it through the workflow-enabled path.

### Using graph features where plain retrieval is enough

For simple grounded Q and A, start with retrieval. Add knowledge graph workflows when the app benefits from entities and relationships.
