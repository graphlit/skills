# Graphlit Skills

Build grounded chat, synced knowledge bases, and graph-aware applications with Graphlit.

Graphlit is the context layer for AI applications and agents. This repo packages the Graphlit skill and a working example app around the modern Graphlit path:

- ingest or sync content first
- wait for Graphlit to finish processing it
- use `streamAgent()` as the streaming harness
- keep retrieval explicit through a standalone tool
- show the evidence in the UI

## Start Here

1. Read [`skills/graphlit/SKILL.md`](skills/graphlit/SKILL.md).
2. Run [`examples/nextjs-streaming-chat`](examples/nextjs-streaming-chat).

## What This Repo Includes

### Graphlit skill

[`skills/graphlit/SKILL.md`](skills/graphlit/SKILL.md) is the routing layer.

It points developers to focused references for:

- Graphlit Studio setup
- direct ingestion
- retrieval
- streaming chat
- collections
- specifications
- feeds
- knowledge graph workflows

### Next.js example

[`examples/nextjs-streaming-chat`](examples/nextjs-streaming-chat) is the canonical example in this repo.

It shows:

- ingestion of a public website URL or public file URL
- polling `isContentDone()` before retrieval
- collection-scoped retrieval
- `streamAgent()` with a standalone `retrieve_contents` tool
- streamed answers with visible retrieved sources

## New to Graphlit?

If this is a true first run:

1. Go to [Graphlit Studio](https://www.graphlit.dev).
2. Create your account.
3. Create your organization.
4. Create your first project.
5. Select that project in the Graphlit Studio sidebar.
6. Copy the project credentials from the selected project.
7. Paste them into `.env.local`.

You also need an `OPENAI_API_KEY` for the streaming example in this repo.

## Verify the Example

```bash
cd examples/nextjs-streaming-chat
npm install
cp .env.example .env.local
npm run check
npm run dev
```

## What Success Looks Like

- the app connects to the intended Graphlit project
- the app ingests a URL and waits for `isContentDone()`
- the agent calls `retrieve_contents`
- the answer streams incrementally
- the UI shows the supporting sources

## Repo Layout

- `skills/graphlit/`
  The reusable Graphlit skill, references, and agent metadata.
- `examples/nextjs-streaming-chat/`
  The canonical Next.js implementation.

## Design Rules

This repo is intentionally opinionated:

- `streamAgent()` is the default chat harness
- retrieval stays explicit through `retrieve_contents`
- ingestion is incomplete until Graphlit says it is ready
- examples stay small enough to copy into a real app quickly

The goal is to make Graphlit feel easier to adopt without hiding how Graphlit actually works.
