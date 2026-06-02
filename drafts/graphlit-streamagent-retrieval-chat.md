# Building Grounded Streaming Chat with Graphlit

Modern Graphlit apps should make one distinction obvious from the start:

- `streamAgent()` is the agent loop and streaming harness
- retrieval should stay explicit through tools

That distinction shapes the whole sample in this repo.

Instead of treating retrieval as a hidden side effect, the example takes a smaller and more inspectable path:

1. ingest a website URL or file URL into Graphlit
2. poll `isContentDone()` until the content is fully processed
3. inject one standalone `retrieve_contents` tool into `streamAgent()`
4. stream the answer and show the retrieved evidence in the UI

That gives developers the modern Graphlit story without forcing them to absorb extra complexity on day one.

## Why this pattern matters

A lot of AI examples collapse ingestion, retrieval, reranking, and answer generation into one opaque flow. That can make the first demo look simple, but it gives developers the wrong mental model.

For Graphlit, the clearer model is:

- Graphlit ingests and processes content
- Graphlit retrieval APIs fetch evidence
- `streamAgent()` orchestrates the model and tool calls
- the app decides how visible retrieval should be

That separation is especially useful when you want to debug grounding quality, change retrieval scope, or explain the system to another engineer.

## Keep the example small

The example in this repo is intentionally compact:

- one Next.js app
- one ingestion route
- one chat route
- one collection scope
- one retrieval tool

That is enough to show the Graphlit value proposition:

- ingest content once
- wait for processing to finish
- retrieve grounded evidence on demand
- stream answers in a modern agentic UX

## Step 1: ingest content and wait until it is actually ready

The sample starts with the smallest useful ingestion flow: accept a public website URL or public file URL, call `ingestUri()`, then poll `isContentDone()`.

That polling step is not optional theater. Retrieval quality depends on Graphlit having finished processing the content. If you skip that gate, you can end up asking the agent questions before the content is reliably available for retrieval.

The app makes that status visible in the UI so developers can see the system move from intake to ready state.

## Step 2: use one retrieval tool instead of a whole platform

The example’s retrieval path is deliberately narrow:

- accept a query
- call `retrieveSources()` against Graphlit
- optionally scope to a collection
- enrich the hits with `lookupContents()`
- return compact results with names, snippets, relevance, and page markers when available

That is the smallest tool that still feels real.

It gives the model enough context to answer grounded questions, and it gives the UI enough structured data to show the evidence below the response.

## Step 3: plug the tool into `streamAgent()`

Once the retrieval tool exists, the rest of the architecture gets simpler.

The chat route passes the tool definition and handler into `streamAgent()`, along with a short system instruction block that tells the model to:

- use `retrieve_contents` before answering knowledge questions
- rely only on already ingested and processed Graphlit content
- say plainly when evidence is weak or incomplete
- cite document names naturally

This keeps the answer grounded without pretending that the harness itself is doing retrieval.

## Step 4: stream the process, not just the answer

The sample forwards a small set of events back to the client:

- `conversation_started`
- `tool_update`
- `message_update`
- `error`

That gives the UI enough information to show the runtime honestly:

- when a conversation is created
- when the retrieval tool runs
- when the answer starts to form
- which sources informed the final response

This is a much better developer experience than a blank spinner followed by a paragraph.

## What developers should take away

If you want the shortest path to a modern Graphlit assistant, you do not need to start with a large orchestration layer.

Start with:

- one ingestion flow
- one readiness gate
- one retrieval tool
- one streaming chat loop

That is enough to teach the right mental model and ship a credible first experience.

From there, teams can expand into richer tools, multiple corpora, connector sync, or more advanced agent behaviors without having to unlearn the architecture they started with.

## Repo links

- Skill: `skills/graphlit/SKILL.md`
- Sample app: `examples/nextjs-streaming-chat`
- Retrieval reference: `skills/graphlit/references/retrieval.md`

The core idea is simple: Graphlit should own the content and retrieval layer, while `streamAgent()` owns the live agent loop. Keeping those roles explicit makes the sample easier to trust, easier to extend, and easier to explain.
