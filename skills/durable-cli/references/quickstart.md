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

If the global install fails with `EACCES` because npm is trying to write under
`/usr` or another root-owned prefix, use a user-level prefix instead of `sudo`:

```bash
npm config set prefix "$HOME/.local"
npm install -g @graphlit/durable-agents
```

Verify `"$HOME/.local/bin"` is on `PATH`, then rerun `durable --version`.

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

For GitHub, the browser handoff includes GitHub authorization plus installing or configuring the Durable Agents GitHub App. Treat that as the normal path for private repository access: Durable can only enumerate and read repositories that the app installation grants.

After connecting GitHub, inspect the account when troubleshooting private repository access:

```bash
durable accounts get <github-account>
```

The output may include `github_app_installation` details. If those fields are unavailable or incomplete, GitHub settings remain the source of truth for which repositories the app can access.

`web`, `rss`, and several direct-auth sources do not require an account. These are the simplest examples:

```bash
durable sources create web \
  --name "OpenAI Changelog" \
  --url "https://developers.openai.com/api/docs/changelog" \
  --schedule 1day

durable sources create rss \
  --name "OpenAI News" \
  --url "https://openai.com/news/rss.xml" \
  --schedule 1day

durable sources list --provider web
durable sources list --provider rss
```

Provider-backed sources use an account plus a type-specific resource flag:

```bash
durable sources create github-issues \
  --account <account-email-or-id> \
  --repo owner/repo
```

For history-capable providers, one create prepares both the historical import source and the new-data monitoring sidecar. `durable sources list` shows the concrete source records after creation so they can still be managed separately.

`--repo https://github.com/owner/repo` is also valid. Use discovery to browse GitHub repositories, but do not require discovery before creation when the repo owner/name or URL is already known.

When a script or demo needs source-ingested content before the next agent prompt, wait on the user-visible Library predicate:

```bash
durable library wait \
  --source "Northwind GitHub Issues" \
  --kind issue \
  --query "Northwind" \
  --timeout 10m
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

After discovery, create the exact repository-backed source type you need:

```bash
durable sources create github-code \
  --account <account-email-or-id> \
  --repo owner/repo
```

If a manual sync reports that a data source is paused, resume it before retrying:

```bash
durable sources resume <source>
durable sources sync <source>
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

Edit agent properties with the canonical property grammar:

```bash
durable agents set "$AGENT_ID" prompt "Answer from the Library context."
durable agents set "$AGENT_ID" prompt --file ./agent-prompt.md
durable agents set "$AGENT_ID" focus "Only use content tagged planning."
durable agents clear "$AGENT_ID" focus
```

Scalar values are positional. List-valued properties use repeated positional
values:

```bash
durable agents set "$AGENT_ID" trigger.kinds text page
durable agents set "$AGENT_ID" heartbeat.active_days 1 2 3 4 5
```

If the workflow needs automation instead of a purely interactive agent, use the
same create surface with explicit schedule, heartbeat, or content-trigger flags:

```bash
durable agents create \
  --name "Daily Briefing" \
  --mode scheduled \
  --cron "0 9 * * 1-5" \
  --timezone America/Los_Angeles \
  --prompt "Prepare a weekday briefing from the latest Library context."

durable agents create \
  --name "Inbox Watcher" \
  --mode heartbeat \
  --every 15m \
  --timezone America/Los_Angeles \
  --prompt "Watch for new inbox content, draft routine replies, and flag anything that needs review."

durable agents create \
  --name "Content Triage" \
  --mode triggered \
  --prompt "Summarize newly finished content and flag items that need attention." \
  --kind email
```

Automation agents receive a generic execution prompt when `--prompt` is omitted.
Use `--prompt` or `--prompt-file` when you want a specific job definition.

## 6. Add Library Content

Use `ingest` for URL or text input:

```bash
durable library ingest \
  --url "https://example.com/docs" \
  --name "Docs Home" \
  --label docs

durable library ingest \
  --text "Sprint notes: focus on onboarding, channels, and CLI polish." \
  --name "Sprint Notes" \
  --label planning
```

Use `upload` for local files:

```bash
durable library upload \
  ./README.md \
  --label repo \
  --wait
```

If the workspace already has a Graphlit collection, attach content with
`--collection <collection-ref>`.

Browse or search the Library:

```bash
durable library list --label docs
durable library list --date-mode added --in-last 7d
durable library list --source "Work Calendar" --kind event
durable library search docs --label docs
durable library search "planning" --source "Work Gmail"
durable library view <content-id>
durable fs ls /library/contents
durable fs find /library/labels/docs
durable fs ls /library/kind
```

## 7. Prompt an Interactive Agent

Send the first user turn to the created interactive agent. This creates a new
run. Scheduled, heartbeat, triggered, webhook, and channel-bound agents run from
their configured activation instead of a first-turn prompt.

```bash
durable agents prompt "$AGENT_ID" \
  "Summarize the sprint notes and the README."
```

The command streams by default. For follow-up inspection:

```bash
durable runs list --agent "$AGENT_ID"
durable runs get <run-id>
durable runs view <run-id>
durable runs view <run-id> --transcript
durable runs watch <run-id>
durable runs prompt <run-id> "Now turn that into three action items."
```

Use `durable runs view <run-id> --no-browser` or `durable library view <content-id> --no-browser` when a coding agent should print the Durable web UI deeplink without trying to open a browser.

If prompt text is omitted, both commands also accept stdin.

For scripts that need bounded synchronous behavior, use `--wait` and
`--timeout`:

```bash
durable agents prompt "$AGENT_ID" \
  --no-stream \
  --wait \
  --timeout 30s \
  "Reply with READY only."
```

## 8. Inspect `/library` Through VFS Commands

Durable exposes a shell-style read-only VFS for Library content under the `durable fs` namespace:

```bash
durable fs ls /library
durable fs ls /library/contents --long
durable fs ls /library/labels/docs --long
durable fs find /library/kind/markdown --date-mode authored --in-last 30d --long
durable fs grep docs /library/labels/docs
durable fs sgrep "semantic topic" /library/labels/docs
durable fs cat /library/<content-id>
durable fs stat /library/<content-id>
durable library inspect <content-id>
```

Important distinction:

- `durable library ...` manages Durable content objects
- `durable library inspect <content-id>` prints a Markdown full-content inspection by content ID
- `durable fs ls/cat/grep/sgrep/find/stat` reads the virtual filesystem view under `/library`

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
durable channels endpoints --provider slack --query ops
durable channels bind \
  --provider slack \
  --agent "$AGENT_ID" \
  --channel "#ops" \
  --workspace "My Workspace"
```

Other BYO chat providers follow the same `durable channels create <provider>` pattern with provider-specific flags.

Durable-hosted email and messaging setup live under the same `channels` group:

```bash
durable channels email create
durable channels email messages list <email-address>
durable channels email messages send <email-address> \
  --to user@example.com \
  --subject "Hello" \
  --text "READY"

durable channels messaging status
durable channels messaging phones register --phone +15555550123
durable channels messaging phones list
```

Pass `--username` only when the workflow needs a vanity address. Usernames are
global under `durableagents.ai`, so a requested name can already be taken.

## 10. Configure MCP Connectors

MCP servers use their own top-level connector group:

```bash
durable connectors create https://example.com/mcp --name "Example MCP" --type http
durable connectors list
```

## What Success Looks Like

- `durable whoami` and `durable status` complete without auth errors
- `durable accounts connect` or `durable sources create web` succeeds when the workflow needs synced external content
- GitHub account setup includes the app installation/update needed for selected private repositories
- the persona and agent are created successfully
- Library content appears through both `durable library list` and `durable fs ls /library/contents`
- source-ingested content can be gated with `durable library wait` before an agent prompt needs it
- `durable agents prompt` streams a usable response
- `durable runs view <run-id> --no-browser` prints a Durable web UI run deeplink
- `durable runs prompt` can add a follow-up turn to an interactive run
- `durable channels create slack` or another provider create command stores a channel configuration

## Common First-Run Issues

### `npm install -g @graphlit/durable-agents` fails with `EACCES`

Usually means npm's global prefix is root-owned, commonly `/usr` or
`/usr/local`. Prefer a user-level prefix:

```bash
npm config set prefix "$HOME/.local"
npm install -g @graphlit/durable-agents
```

Then verify `"$HOME/.local/bin"` is on `PATH` and retry `durable --version`.

### `durable status` says the CLI is not authenticated

Usually means:

- `durable login` never completed the browser pairing flow
- the local credential file is missing
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
- for GitHub, the app installation was not completed or does not include the repository the user expects

### `durable sources create` fails on a provider-backed source

Usually means:

- the source account was not connected first
- the type-specific resource flag such as `--repo`, `--channel`, `--calendar`, `--drive`, `--folder`, `--database`, or `--page` was missing
- the supplied resource name did not resolve and should be discovered first with `durable sources discover`; for GitHub, pass `--repo owner/repo` or the full GitHub URL directly when the repository is already known

### `durable library upload` fails on a file

Usually means:

- the file path does not exist
- the file extension does not map to a supported MIME type

### `durable library wait` times out

Usually means:

- async source ingestion has not produced matching content yet
- the `--source`, `--kind`, `--query`, label, collection, mention, or date filter is too narrow
- the connected account or source cannot access the expected provider resource

### VFS commands read Durable Library content

This is expected. `durable fs ls`, `cat`, `grep`, `sgrep`, `find`, and `stat` operate on the Durable `/library` VFS.

### Channel creation fails

Usually means:

- required provider secrets were not passed
- the provider itself still needs manual app-side setup after the Durable-side configuration step
