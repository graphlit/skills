---
name: durable-cli
description: Use this skill when the user wants to install, authenticate, script, or operate Durable Agents from the terminal with the Durable CLI, including agents, runs, library content, VFS commands, channels, and MCP connectors.
version: "1.0.0"
---

# Durable CLI

Durable CLI is the terminal surface for Durable Agents. Use it when a developer or coding agent needs to authenticate a Durable workspace, create or run agents, load Library content, inspect `/library` through shell-style VFS commands, configure channel providers, or automate workflows with `--json`.

Before writing commands, load the relevant reference from the table below. Do not guess command names from older drafts or adjacent products. Use the current Durable CLI command surface exactly as documented here.

## Install And Verify

Install the published CLI from npm:

```bash
npm install -g @graphlit/durable-agents
durable --version
durable --help
```

The executable is `durable`. The npm package is `@graphlit/durable-agents`.

## First Commands

For the shortest valid first session:

```bash
durable login
durable whoami
durable status
```

After authentication, the next most common commands are:

```bash
durable agents list
durable library list
durable runs list
```

## References

Load the reference that matches the developer task:

| Reference | Load when |
|-----------|-----------|
| `references/quickstart.md` | First-time install, login, first agent, first run, loading Library content, VFS inspection, and initial channel setup |
| `references/command-surface.md` | Choosing the right command family, scripting with `--json`, understanding naming conventions, and avoiding outdated aliases |

## Core Concepts

| Concept | Description |
|---------|-------------|
| **API key** | The Durable credential used by the CLI after `durable login` or `durable auth import`. |
| **Persona** | Instructional behavior that can be attached to an agent. |
| **Agent** | The Durable object that owns execution behavior, model choice, and persona attachment. |
| **Run** | One execution of an agent started through `durable agents start`. |
| **Library** | Durable content objects managed through `durable library ...`. |
| **GraphlitFs** | The read-only virtual filesystem mounted at `/library`, exposed through `ls`, `cat`, `grep`, `find`, and `inspect`. |
| **MCP connector** | An external MCP server connection managed through the top-level `durable connectors ...` group. |
| **Channel provider** | A BYO messaging or chat integration such as Slack, Teams, Discord, Telegram, Google Chat, or WhatsApp, managed through `durable channels ...`. |
| **Endpoint** | A discovered bindable destination under a configured channel provider. |

## Quick Decision Guide

- **Need the fastest path from install to a working session?** Load `references/quickstart.md`.
- **Need to know the exact command family for content, VFS, channels, or connectors?** Load `references/command-surface.md`.

## Default CLI Path

1. Install the CLI and verify the binary.
2. Authenticate with `durable login`.
3. Confirm the active account with `durable whoami` and `durable status`.
4. Create a persona if the agent needs explicit instructions.
5. Create an agent.
6. Load context with `durable library ingest` or `durable library upload`.
7. Start a run with `durable agents start`.
8. Use `durable --json` when another tool or script needs machine-readable output.

## Agent Behavior

- Prefer the exact current Durable CLI syntax over historical or speculative aliases.
- Use `durable agents start`, not `durable runs start` or a root `durable run` shortcut.
- Use `durable library ingest` for URL or text input and `durable library upload` for local files.
- Use `durable channels create ...`, `durable channels list`, and `durable channels delete` for channel providers.
- Reserve top-level `durable connectors ...` for MCP connectors, not channel providers.
- Treat `ls`, `cat`, `grep`, `find`, and `inspect` as intentional shell-style wrappers over `/library`.
- Use `--json` whenever the workflow needs to capture IDs or parse structured output.

## Rules

- Do not invent or reuse removed Durable CLI aliases such as `durable run`, `durable runs start`, `durable resume`, `durable library add`, or `durable channels connectors ...`.
- Do not treat `/library` VFS commands as local filesystem commands; they only operate on Durable Library content.
- For Library ingest, use exactly one of `--url` or `--text`.
- Use GUIDs captured from `--json` output for object-specific automation when precision matters.
- If a workflow spans auth, agent creation, Library ingest, and execution, load both references before writing commands.
