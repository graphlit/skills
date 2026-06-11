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

- use positional prompt text, `--file`, or stdin for `durable agents start` and `durable runs prompt`
- use `durable agents set <agent> <property> <value>` and `durable agents clear <agent> <property>` for canonical agent mutation
- use `durable agents set <agent> schedule.cron "0 7 * * 1-5"` and `durable agents set <agent> schedule.timezone America/Los_Angeles` for scheduled agents
- use `durable agents set <agent> heartbeat.frequency_minutes 30` for heartbeat agents
- use `durable agents set <agent> trigger.kinds text page` for content-triggered agents
- use `durable agents update --state enabled|disabled` for explicit lifecycle toggles
- treat `durable agents update ...` as an older compatibility surface for simple field edits and create-time automation flags
- use `durable agents start --wait --timeout <duration>` and `durable runs prompt --wait --timeout <duration>` for scripted run control

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
durable library update
durable library delete
durable library search
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
- use `durable fs ...` for reading the `/library` filesystem view by VFS path
- use `durable fs grep` for keyword/lexical Graphlit content search
- use `durable fs sgrep` for semantic/hybrid Graphlit content search

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
- GitHub account connection may include a GitHub App install/update step; that app installation controls which private repositories Durable can enumerate and read
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
durable agents start --help
durable runs prompt --help
durable sources create --help
durable channels bind --help
```
