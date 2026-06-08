# Quickstart

Use this reference for the fastest path from a new Durable CLI install to a working Durable Agents session.

## On This Page

- install
- prerequisites
- sign in
- connect accounts and create sources
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
- a browser available for `durable login` and provider OAuth handoffs
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
- the workspace is usable for content, sources, agents, runs, and channels

## 4. Connect Accounts and Create Sources

External source accounts use a browser handoff similar to `durable login`.

```bash
durable accounts connect github
durable accounts list
```

By default, the CLI opens a browser. If the terminal cannot open one, use `--no-browser` to print the authorization URL, finish the provider flow in the browser, then return to the terminal and verify the account through `durable accounts list` or `durable accounts get`.

`web` and several direct-auth sources do not require an account. `web` is the simplest example:

```bash
durable sources create web \
  --name "Graphlit Docs Web" \
  --url "https://docs.graphlit.dev"

durable sources list --provider web
```

Provider-backed sources use an account plus a type-specific resource flag:

```bash
durable sources create github-issues \
  --account <account-email-or-id> \
  --repo https://github.com/owner/repo
```

Direct-auth sources pass provider credentials inline instead of using `durable accounts ...`:

```bash
durable sources create amazon-s3 \
  --name "Customer Exports" \
  --bucket acme-exports \
  --access-key <access-key> \
  --secret-key <secret-key> \
  --region us-east-1
```

Use discovery when the resource is not obvious up front:

```bash
durable sources discover github \
  --account <account-email-or-id> \
  --search repo-name
```

## 5. Create a Persona and Agent

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

If the workflow needs automation instead of a purely interactive agent, use the
same create surface with explicit schedule or heartbeat flags:

```bash
durable agents create \
  --name "Daily Briefing" \
  --cron "0 9 * * 1-5" \
  --timezone America/Los_Angeles

durable agents create \
  --name "Inbox Watcher" \
  --heartbeat-every 15m \
  --timezone America/Los_Angeles
```

## 6. Add Library Content

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

## 7. Run an Agent

Start a run against the created agent:

```bash
durable agents start "$AGENT_ID" \
  "Summarize the sprint notes and the README."
```

The command streams by default. For follow-up inspection:

```bash
durable runs list --agent "$AGENT_ID"
durable runs get <run-id>
durable runs watch <run-id>
durable runs prompt <run-id> "Now turn that into three action items."
```

If prompt text is omitted, both commands also accept stdin.

For scripts that need bounded synchronous behavior, use `--wait` and
`--timeout`:

```bash
durable agents start "$AGENT_ID" \
  --no-stream \
  --wait \
  --timeout 30s \
  "Reply with READY only."
```

## 8. Inspect `/library` Through VFS Commands

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

## 9. Configure Channels

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

## 10. MCP Connectors Stay Separate

Do not use `durable channels ...` for MCP servers. MCP connectors have their own top-level group:

```bash
durable connectors create https://example.com/mcp --name "Internal MCP" --type http
durable connectors list
```

## What Success Looks Like

- `durable whoami` and `durable status` complete without auth errors
- `durable accounts connect` or `durable sources create web` succeeds when the workflow needs synced external content
- the persona and agent are created successfully
- Library content appears through both `durable library list` and `durable ls /library`
- `durable agents start` streams a usable response
- `durable runs prompt` can add a follow-up turn to an interactive run
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

### `durable accounts connect` or `durable accounts reconnect` does not finish

Usually means:

- the provider OAuth flow was never completed in the browser
- the CLI could not open a browser and `--no-browser` was not used
- the account needs to be re-authorized and should use `durable accounts reconnect`

### `durable sources create` fails on a provider-backed source

Usually means:

- the source account was not connected first
- the type-specific resource flag such as `--repo`, `--channel`, `--calendar`, `--drive`, `--folder`, `--database`, or `--page` was missing
- the supplied resource name did not resolve and should be discovered first with `durable sources discover`

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
