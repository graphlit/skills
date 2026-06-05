# Graphlit Skills

Build grounded chat, synced knowledge bases, and graph-aware applications with Graphlit.

Graphlit is the context layer for AI applications and agents. This repo gives developers and coding agents the canonical Graphlit path: ingest or sync content, wait for processing, retrieve explicit evidence, and stream grounded answers with `streamAgent()`.

[Use the Skill](skills/graphlit/SKILL.md) · [Run the Example](examples/nextjs-streaming-chat) · [Read the Docs](https://docs.graphlit.dev) · [Open Graphlit Studio](https://www.graphlit.dev)

## Why This Repo Exists

When a developer asks an agent to "add Graphlit", the result should use Graphlit primitives instead of drifting into generic RAG scaffolding.

This repo provides:

- a reusable `graphlit` skill that routes the agent to the right Graphlit references
- a reusable `durable-cli` skill that teaches coding agents how to install, authenticate, and operate Durable Agents from the terminal
- a minimal Next.js example that proves the modern Graphlit app shape
- task-specific implementation guides for ingestion, retrieval, collections, feeds, specifications, and knowledge graph workflows

## What You Can Build

- grounded chat over documents, websites, notes, transcripts, and synced external content
- customer-scoped or workspace-scoped assistants using collections
- continuously synced knowledge bases from Slack, Google Drive, email, RSS, S3, and web crawls
- graph-aware applications that extract entities and relationships during ingest

## Canonical Graphlit Path

1. Verify credentials with `getProject()`.
2. Ingest content with `ingestUri()` or sync a source with `createFeed()`.
3. Wait for `isContentDone()` or `isFeedDone()` before retrieval depends on new content.
4. Scope retrieval with a collection when the app has a clear dataset, tenant, customer, project, or workspace boundary.
5. Use `streamAgent()` as the chat harness.
6. Keep retrieval explicit through a standalone `retrieve_contents` tool backed by `retrieveSources()` and `lookupContents()`.
7. Return and render visible sources in the UI.

## What You Get In This Repo

### `skills/graphlit/`

The reusable Graphlit skill and its task-specific references. Start with [SKILL.md](skills/graphlit/SKILL.md) when the goal is to integrate Graphlit into an application or have a coding agent do it correctly.

### `skills/durable-cli/`

The reusable Durable CLI skill and its walkthrough references. Start with [SKILL.md](skills/durable-cli/SKILL.md) when the goal is to install, authenticate, script, or operate Durable Agents from a terminal without drifting into outdated command aliases.

### `examples/nextjs-streaming-chat/`

The canonical sample app for this repo. It shows:

- URL ingestion with `ingestUri()`
- readiness polling with `isContentDone()`
- collection-scoped retrieval
- `streamAgent()` with a standalone `retrieve_contents` tool
- streamed answers with visible sources

### `drafts/`

Working drafts that can be adapted into docs, examples, or longer-form content later.

## Get Started

### New to Graphlit?

1. Open [Graphlit Studio](https://www.graphlit.dev).
2. Create your account, organization, and first project.
3. Select that project so its project card is visible.
4. Choose the target environment tab, usually `Preview` or `Production`.
5. Click `Copy Environment Variables`.
6. Paste the copied values into `.env.local`.
7. Add `OPENAI_API_KEY` for the streaming example.

### Run the Example

```bash
cd examples/nextjs-streaming-chat
npm install
cp .env.example .env.local
npm run check
npm run dev
```

Open `http://localhost:3000`.

## Success Looks Like

- the app connects to the intended Graphlit project
- a URL ingests successfully
- retrieval waits for content readiness
- the agent calls `retrieve_contents`
- the answer streams incrementally
- the UI shows the supporting sources

## Design Principles

- prefer Graphlit SDK primitives over generic RAG stacks
- keep retrieval explicit and inspectable
- do not rely on newly ingested or newly synced content until Graphlit says it is ready
- keep examples small enough to copy into real apps quickly

The goal is to make Graphlit easy to adopt without hiding how Graphlit actually works.
