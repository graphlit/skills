# Command Surface

Use this reference when the developer needs the right Durable CLI command family and naming pattern, especially after older aliases or draft docs have changed.

## Current Naming Rules

- `create` is for managed first-class resources
- `ingest` is for URL or text content entering the Library
- `upload` is for local file transfer into the Library
- `connect` is for source-account OAuth and MCP connector auth/lifecycle
- `reconnect` is for re-authorizing an existing source account
- `discover` is for resolving provider resources before creating a data source
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
durable runs prompt
durable runs events
durable runs watch
durable runs replay
durable runs pause
durable runs resume
durable runs cancel
```

Important:

- do not use older or removed execution aliases such as `durable run`, `durable runs start`, or `durable resume`
- use positional prompt text, `--file`, or stdin for `durable agents start` and `durable runs prompt`
- use `durable agents create/update --cron --timezone` for scheduled agents
- use `durable agents create/update --heartbeat-every --timezone` for heartbeat agents
- use `durable agents update --state enabled|disabled` for explicit lifecycle toggles
- use `durable agents start --wait --timeout <duration>` and `durable runs prompt --wait --timeout <duration>` for scripted run control

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

## Source Accounts and Data Sources

Use these when Durable needs synced external content.

### Source accounts

Use `durable accounts ...` for external account OAuth state:

```bash
durable accounts list
durable accounts connect <provider>
durable accounts get <account>
durable accounts reconnect <account>
durable accounts delete <account>
```

Important:

- `durable accounts connect` opens a browser by default and can print the authorization URL with `--no-browser`
- the browser completes the provider OAuth flow and then returns the user to the terminal
- use `durable accounts ...`, not `durable connectors ...`, for GitHub, Google, Microsoft, Slack, Notion, and other source accounts

### Data sources

Use `durable sources ...` for synced external sources:

```bash
durable sources list
durable sources get <source>
durable sources discover <type>
durable sources create <type>
durable sources update <source>
durable sources pause <source>
durable sources resume <source>
durable sources sync <source>
durable sources delete <source>
```

Important:

- `durable sources create web --url ...` is the simplest accountless path for web sync
- account-backed sources use `--account` plus a type-specific flag such as `--repo`, `--channel`, `--calendar`, `--drive`, `--folder`, `--database`, or `--page`
- direct-auth sources pass provider credentials inline, for example `--bucket` plus `--access-key` for `amazon-s3`, `--api-key` for `fireflies`, or `--token` for `discord`
- use `durable sources discover ...` when the user needs help resolving a repo, channel, calendar, folder, or database before create
- keep `accounts` and `sources` separate mentally: accounts authenticate access, sources define what Durable syncs

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
- `durable runs continue` -> `durable runs prompt`
- `durable connectors connect github` -> `durable accounts connect github`
- `durable connectors connect google` -> `durable accounts connect google`
- `durable data-sources ...` -> `durable sources ...`
- `durable resume` -> `durable runs resume`
- `durable library add` -> `durable library ingest` or `durable library upload`
- `durable channels connectors create slack` -> `durable channels create slack`
- `durable connector ...` -> `durable connectors ...`
