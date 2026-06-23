# Command Surface

Use this reference when the developer needs the right Durable CLI command family and naming pattern.

## Current Naming Rules

- `create` is for managed first-class resources
- `ingest` is for URL or text content entering the Library
- `upload` is for local file transfer into the Library
- `connect` is for source-account OAuth and MCP connector auth/lifecycle
- `reconnect` is for re-authorizing an existing source account
- `discover` is for resolving provider resources before creating a data source
- `bind` and `unbind` are for attaching agents to channel endpoints
- `durable fs ls`, `cat`, `grep`, `sgrep`, `find`, and `stat` are intentional shell-style VFS affordances

## Auth, Keys, Models, And Usage

Use these for sign-in and credential visibility:

```bash
durable login
durable logout
durable whoami
durable status
durable auth import
durable auth export
durable keys list
durable keys create
durable keys revoke
durable models list
durable usage
```

## Agents and Runs

Use grouped commands for execution:

```bash
durable agents list
durable agents create
durable agents get
durable agents set
durable agents clear
durable agents prompt
durable agents update
durable agents delete

durable runs list
durable runs get
durable runs view
durable runs prompt
durable runs events
durable runs watch
durable runs replay
durable runs pause
durable runs resume
durable runs cancel
```

Important:

- use `durable agents create` to create the agent object and persist core behavior
- omit `--mode` for a promptless interactive chat agent, or set `--mode interactive` explicitly
- include `--mode scheduled --cron ...`, `--mode heartbeat --every ...`, or `--mode triggered ...` on `agents create` when the background behavior is known up front
- automation agents receive a generic execution prompt when created without `--prompt`; pass `--prompt` or `--prompt-file` when you want specific behavior
- scheduled, heartbeat, triggered, webhook, and channel-bound agents run from their configured activation; do not manually kick them off with the CLI
- use `durable agents prompt` for the first user turn on an interactive agent, which creates a new run
- use `durable runs prompt` for follow-up turns on an existing interactive run
- use `durable runs view <run-id>` to open the Durable web UI flow deeplink, or `durable runs view <run-id> --transcript` for transcript view
- use `durable runs view <run-id> --no-browser` when a script or coding agent should print the deeplink instead of launching a browser
- use positional prompt text, `--file`, or stdin for `durable agents prompt` and `durable runs prompt`
- use `durable agents schedule <agent> --cron "0 7 * * 1-5" --timezone America/Los_Angeles --prompt "..."` or `--prompt-file ./prompt.md` to convert an existing interactive agent into a scheduled agent
- use `durable agents unschedule <agent>` to return a scheduled agent to promptless interactive mode
- use `durable agents set <agent> <property> <value>` and `durable agents clear <agent> <property>` for lower-level agent mutation
- use `durable agents set <agent> schedule.cron "0 7 * * 1-5"` and `durable agents set <agent> schedule.timezone America/Los_Angeles` only when you intentionally need property-level scheduled-agent edits
- use `durable agents set <agent> heartbeat.frequency_minutes 30` for heartbeat agents
- use `durable agents set <agent> trigger.kinds text page` for content-triggered agents
- use `durable agents update --state enabled|disabled` for explicit lifecycle toggles
- treat `durable agents update ...` as an older compatibility surface for simple field edits and create-time automation flags
- use `durable agents prompt --wait --timeout <duration>` and `durable runs prompt --wait --timeout <duration>` for scripted run control
- use `durable runs events <run-id> --summary` for a compact, auto-paged tool/execution timeline; `--compact` and `--tools` are aliases
- use raw `durable runs events <run-id> --cursor <cursor> --limit <n>` when you need paginated event rows instead of the operator summary

Property mutation examples:

```bash
durable agents set <agent> prompt "Run the daily account sweep."
durable agents set <agent> prompt --file ./prompt.md
durable agents set <agent> focus "Only use Q4 customer content."
durable agents set <agent> trigger.kinds text page
durable agents clear <agent> focus
durable agents set <agent> mode interactive
```

Scalar values are positional by default. List properties use repeated
positional values. The global `--json` flag is output-only, not a JSON input
parser.

## Personas And Skills

Use these for reusable agent behavior:

```bash
durable personas list
durable personas create
durable personas get
durable personas update
durable personas delete

durable skills list
durable skills create
durable skills get
durable skills update
durable skills delete
```

Important:

- use `durable personas create/update --file <path>` when instructions are easier to maintain in a local file
- use `durable skills create/update --text ...` or `--file <path>` for reusable skill instructions

## Library vs VFS

These are different surfaces and should not be mixed mentally.

### Library resource commands

Use these when managing Durable content objects directly:

```bash
durable library list
durable library ingest
durable library upload
durable library get
durable library inspect
durable library view
durable library update
durable library delete
durable library search
durable library wait
```

### VFS shell affordances

Use these when reading the `/library` virtual filesystem:

```bash
durable fs ls
durable fs cat
durable fs grep
durable fs sgrep
durable fs find
durable fs stat
```

Important:

- keep `durable library ...` for content management
- use `durable library inspect <content-id>` for Markdown-formatted full content inspection by content ID
- use `durable library view <content-id>` to open the browser content viewer deeplink, or add `--no-browser` to print the URL
- use `durable fs ...` for reading the `/library` filesystem view by VFS path; `/library` is the navigation root and `/library/contents` is the flat all-content listing
- use repeatable `--source`, `--kind`, `--label`, `--collection`, and `--mention <kind>:<ref>` filters on Library list/search/wait commands when narrowing content
- do not use lookup-only mention kind parent paths such as `/library/mentions/email`; use a concrete value path such as `/library/mentions/email/<encoded-email>` or `--mention email:<address>`
- use `--in-last <duration>` with `--date-mode added|authored` on Library and VFS listing/search commands when filtering by date added or date authored
- use `durable library wait --source <source> [--kind <kind>] [--query <query>] --timeout <duration>` when a script needs to block until async source-ingested content is visible through Library before prompting an agent
- use `durable fs grep` for keyword/lexical Graphlit content search
- use `durable fs sgrep` for semantic/hybrid Graphlit content search

## Source Accounts and Data Sources

Use these when Durable needs synced external content.

### Source accounts

Use `durable accounts ...` for external account OAuth state:

```bash
durable accounts list
durable accounts connect <provider>
durable accounts connect google --enable read,write
durable accounts get <account>
durable accounts reconnect <account>
durable accounts reconnect <account> --enable read,write
durable accounts delete <account>
```

Important:

- `durable accounts connect` opens a browser by default and can print the authorization URL with `--no-browser`
- account connection defaults to read access; use `--enable read` for explicit read-only access and `--enable read,write` for read plus action/write scopes
- do not use a standalone `write` access set, raw provider scopes, or a `--write` flag
- the browser completes the provider OAuth flow and then returns the user to the terminal
- GitHub account connection opens GitHub authorization plus the Durable Agents GitHub App install/configure flow; that app installation controls which private and organization repositories Durable can enumerate and read
- `durable accounts connect github`, `durable accounts reconnect <github-account>`, and `durable accounts get <github-account>` may print `github_app_installation` fields; use them to confirm whether Durable saw the GitHub App installation metadata, but treat GitHub settings as the authority for selected repository access
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
- history-capable account-backed source creation prepares both concrete data source records automatically: the historical import source and the new-data monitoring sidecar
- direct-auth sources pass provider credentials inline, for example `--bucket` plus `--access-key` for `amazon-s3`, `--api-key` for `fireflies`, or `--token` for `discord`
- for GitHub-backed source types, `--repo owner/repo` and `--repo https://github.com/owner/repo` are both valid; prefer `owner/repo` in concise runbooks and use the full URL when copying from a browser
- use `durable sources discover ...` when the user needs help browsing provider resources before create, but do not depend on GitHub discovery for source creation; if the repo is known, create directly with `--repo`
- if `durable sources sync <source>` says the source is paused, run `durable sources resume <source>` and then retry `durable sources sync <source>`
- after creating or syncing an async source in a script, use `durable library wait --source <source> [--kind <kind>] [--query <query>] --timeout <duration>` as the readiness gate instead of hand-rolled sleeps
- keep `accounts` and `sources` separate mentally: accounts authenticate access, sources define what Durable syncs
- list/get/update/delete operate on the concrete source records after creation, so the import source and monitoring sidecar can still be managed separately when needed

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
durable channels email messages list
durable channels email messages get
durable channels email messages send
durable channels messaging status
durable channels messaging phones register
durable channels messaging phones list
durable channels messaging phones delete
```

Important:

- use `durable channels ...` for channel providers
- use `durable connectors ...` for MCP servers
- use `durable channels endpoints --query ...` to narrow bindable destinations
- use `durable channels bind --type ...` or `unbind --type ...` only when the endpoint type needs an explicit override
- use `durable channels email create` without `--username` for the default generated AgentMail address; requested usernames are global under `durableagents.ai` and may return a collision

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

## Verify Before Scripting

When command details matter, prefer the live help output before producing automation:

```bash
durable --help
durable agents prompt --help
durable runs prompt --help
durable sources create --help
durable channels bind --help
```
