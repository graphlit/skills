# Quickstart

Use this reference for the fastest path from a new Durable CLI install to a working Durable Agents session.

## On This Page

- install
- prerequisites
- sign in
- create a persona and agent
- add Library content
- run an agent
- inspect `/library`
- configure channels
- common first-run issues

## 1. Install the CLI

Install the published CLI:

```bash
npm install -g @graphlit/durable-agents
durable --version
durable --help
```

## 2. Prerequisites

Before using the CLI, the developer needs:

- a Durable account
- access to a Durable workspace
- a browser available for `durable login`
- `jq` if the workflow needs to capture IDs from `--json` output

## 3. Sign In

Authenticate once on each device:

```bash
durable login
durable whoami
durable status
```

What this proves:

- the CLI can open or print the login handoff
- a Durable API key was stored successfully
- the active account can reach the Durable API
- the workspace is usable for content, agents, runs, and channels

## 4. Create a Persona and Agent

For the cleanest scripted path, create the persona first and capture its ID:

```bash
PERSONA_ID="$(
  durable --json personas create \
    --name "CLI Assistant Persona" \
    --role "General assistant" \
    --instructions "Help with research, summarization, and triage." \
  | jq -r '.id'
)"
```

Create the agent and attach that persona:

```bash
AGENT_ID="$(
  durable --json agents create \
    --name "CLI Assistant" \
    --description "Starter agent created from the Durable CLI." \
    --persona "$PERSONA_ID" \
  | jq -r '.id'
)"

durable agents get "$AGENT_ID"
```

## 5. Add Library Content

Use `ingest` for URL or text input:

```bash
durable library ingest \
  --url "https://docs.graphlit.dev" \
  --name "Graphlit Docs Home" \
  --path /research \
  --label graphlit

durable library ingest \
  --text "Sprint notes: focus on onboarding, channels, and CLI polish." \
  --name "Sprint Notes" \
  --path /notes \
  --label planning
```

Use `upload` for local files:

```bash
durable library upload \
  ./README.md \
  --path /project \
  --label repo \
  --wait
```

Browse or search the Library:

```bash
durable library list --path /project
durable library search graphlit --path /research
```

## 6. Run an Agent

Start a run against the created agent:

```bash
durable agents start "$AGENT_ID" \
  --prompt "Summarize the sprint notes and the README."
```

The command streams by default. For follow-up inspection:

```bash
durable runs list --agent "$AGENT_ID"
durable runs get <run-id>
durable runs watch <run-id>
```

## 7. Inspect `/library` Through VFS Commands

Durable exposes a shell-style read-only VFS for Library content. These commands are top-level by design:

```bash
durable ls /library
durable ls /library/project --long
durable find /library --name README --long
durable grep graphlit /library
durable cat /library/project/<content-id>
durable inspect /library/project/<content-id>
```

Important distinction:

- `durable library ...` manages Durable content objects
- `durable ls/cat/grep/find/inspect` reads the virtual filesystem view under `/library`

## 8. Configure Channels

Slack currently has the most guided setup flow:

```bash
durable channels setup slack
durable channels create slack \
  --name "Workspace Slack" \
  --signing-secret "<signing-secret>" \
  --bot-token "xoxb-..." \
  --app-id "<slack-app-id>"

durable channels list
durable channels endpoints --provider slack
durable channels bind \
  --provider slack \
  --agent "$AGENT_ID" \
  --channel "#ops" \
  --workspace "My Workspace"
```

Other BYO chat providers follow the same `durable channels create <provider>` pattern with provider-specific flags.

## 9. MCP Connectors Stay Separate

Do not use `durable channels ...` for MCP servers. MCP connectors have their own top-level group:

```bash
durable connectors create https://example.com/mcp --name "Internal MCP" --type http
durable connectors list
```

## What Success Looks Like

- `durable whoami` and `durable status` complete without auth errors
- the persona and agent are created successfully
- Library content appears through both `durable library list` and `durable ls /library`
- `durable agents start` streams a usable response
- `durable channels create slack` or another provider create command stores a channel configuration

## Common First-Run Issues

### `durable status` says the CLI is not authenticated

Usually means:

- `durable login` never completed the browser pairing flow
- the stored credential was removed locally
- `DURABLE_API_KEY` is set in the environment and is overriding the stored file credential

### `durable library ingest` fails immediately

Usually means:

- both `--url` and `--text` were passed
- neither `--url` nor `--text` was passed
- the supplied URL is malformed

### `durable library upload` fails on a file

Usually means:

- the file path does not exist
- the file extension does not map to a supported MIME type

### VFS commands do not read local files

This is expected. `durable ls`, `cat`, `grep`, `find`, and `inspect` operate on the Durable `/library` VFS, not the local filesystem.

### Channel creation fails

Usually means:

- required provider secrets were not passed
- the relevant `DURABLE_*` environment variables were missing
- the provider itself still needs manual app-side setup after the Durable-side configuration step
