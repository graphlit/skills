# Command Surface

Use this reference when the developer needs the right Durable CLI command family and naming pattern, especially after older aliases or draft docs have changed.

## Current Naming Rules

- `create` is for managed first-class resources
- `ingest` is for URL or text content entering the Library
- `upload` is for local file transfer into the Library
- `connect` and `disconnect` are for MCP connector auth/lifecycle
- `bind` and `unbind` are for attaching agents to channel endpoints
- `ls`, `cat`, `grep`, `find`, and `inspect` are intentional shell-style VFS affordances

## Root Auth Commands

Use these for sign-in and credential visibility:

```bash
durable login
durable logout
durable whoami
durable status
durable auth import
durable auth export
```

## Agents and Runs

Use grouped commands for execution:

```bash
durable agents list
durable agents create
durable agents get
durable agents start
durable agents update
durable agents delete

durable runs list
durable runs get
durable runs events
durable runs watch
durable runs replay
durable runs pause
durable runs resume
durable runs cancel
```

Important:

- do not use older or removed execution aliases such as `durable run`, `durable runs start`, or `durable resume`

## Library vs VFS

These are different surfaces and should not be mixed mentally.

### Library resource commands

Use these when managing Durable content objects directly:

```bash
durable library list
durable library ingest
durable library upload
durable library get
durable library update
durable library delete
durable library search
```

### VFS shell affordances

Use these when reading the `/library` virtual filesystem:

```bash
durable ls
durable cat
durable grep
durable find
durable inspect
```

Important:

- do not reintroduce `durable library add`
- do not move VFS commands under `library` in examples or automation

## MCP Connectors vs Channel Providers

These are separate nouns.

### MCP connectors

Use `durable connectors ...` only for MCP servers:

```bash
durable connectors list
durable connectors create <url>
durable connectors get <connector>
durable connectors update <connector>
durable connectors connect <connector>
durable connectors disconnect <connector>
durable connectors delete <connector>
```

### Channel providers

Use `durable channels ...` for Slack, Teams, Discord, Telegram, Google Chat, and WhatsApp:

```bash
durable channels setup slack
durable channels list
durable channels create slack
durable channels create teams
durable channels create discord
durable channels create telegram
durable channels create google-chat
durable channels create whatsapp
durable channels delete <channel-id>
durable channels endpoints
durable channels bind
durable channels unbind
durable channels email list
durable channels email create
durable channels email delete
```

Important:

- do not use the outdated `durable channels connectors ...` form
- do not use `durable connectors create --provider slack` for channel providers

## Output Modes

Use the default output for human-in-the-loop terminal work.

Use `--json` when:

- capturing IDs into shell variables
- piping output into `jq`
- handing structured data to another tool or agent

Example:

```bash
AGENT_ID="$(
  durable --json agents create --name "CLI Assistant" | jq -r '.id'
)"
```

## Common Corrections

If you see one of these, rewrite it:

- `durable run` -> `durable agents start`
- `durable runs start` -> `durable agents start`
- `durable resume` -> `durable runs resume`
- `durable library add` -> `durable library ingest` or `durable library upload`
- `durable channels connectors create slack` -> `durable channels create slack`
- `durable connector ...` -> `durable connectors ...`
