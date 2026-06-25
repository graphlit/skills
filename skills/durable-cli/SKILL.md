---
name: durable-cli
description: Use this skill when the user wants to install, authenticate, connect source accounts, manage data sources, script, or operate Durable Agents from the terminal with the Durable CLI, including automated agents, runs, library content, VFS commands, channels, and MCP connectors.
---

# Durable CLI

Durable CLI is the terminal surface for Durable Agents. Use it when a developer or coding agent needs to authenticate a Durable workspace, connect source accounts, create data sources, create or run agents, load Library content, inspect `/library` through `durable fs` shell-style VFS commands, configure channel providers, or automate workflows with `--json`.

Before writing commands, load the relevant reference from the table below. Use the current Durable CLI command surface exactly as documented here, and verify uncertain flags with `durable <group> --help`.

## Install And Verify

Install the published CLI from npm:

```bash
npm install -g @graphlit/durable-agents
durable --version
durable --help
```

The executable is `durable`. The npm package is `@graphlit/durable-agents`.

If `npm install -g` fails with `EACCES` because the global npm prefix is root-owned, do not use `sudo`. Prefer a user-level prefix:

```bash
npm config set prefix "$HOME/.local"
npm install -g @graphlit/durable-agents
```

Verify `"$HOME/.local/bin"` is on `PATH`; if it is not, add it to the user's shell profile before retrying `durable --version`.

## First Commands

For the shortest valid first session:

```bash
durable login
durable whoami
durable status
```

After authentication, the next most common commands are:

```bash
durable usage
durable models list
durable accounts list
durable sources list
durable agents list
durable library list
durable runs list
durable runs search "renewal risk"
```

## References

Load the reference that matches the developer task:

| Reference | Load when |
|-----------|-----------|
| `references/quickstart.md` | First-time install, login, first source account or data source, first agent, first run, loading Library content, VFS inspection, and initial channel setup |
| `references/command-surface.md` | Choosing the right command family, scripting with `--json`, and understanding naming conventions |

## Core Concepts

| Concept | Description |
|---------|-------------|
| **API key** | The Durable credential used by the CLI after `durable login` or `durable auth import`. |
| **Model** | A model preset surfaced through `durable models list` and selected on agents with `--model`. |
| **Persona** | Instructional behavior that can be attached to an agent. |
| **Skill** | Reusable agent instructions managed through `durable skills ...`. |
| **Agent** | The Durable object that owns execution behavior, model choice, persona attachment, and optional automation such as scheduled, heartbeat, or content-triggered operation. |
| **Run** | One execution of an agent. `durable agents prompt` creates a new run for an existing interactive agent. Scheduled, heartbeat, triggered, webhook, and channel-bound agents create runs from their configured automation or incoming events. `durable runs list` shows recent run records for execution state and control, retained for about 30 days after their last update. Use `durable runs search "<query>"` to find completed run memories, which remain searchable until deleted. Interactive runs can be prompted again through `durable runs prompt`, and both prompt surfaces support `--wait` plus `--timeout` for scripted control. |
| **Library** | Graphlit content objects managed through `durable library ...`. Use Graphlit labels, collections, sources, kinds, and mentions for organization and filtering. |
| **Source account** | A reusable external account connection such as GitHub, Google, Microsoft, Slack, or Notion, managed through `durable accounts ...`. |
| **Data source** | A synced external source managed through `durable sources ...`. Some data sources use a source account, while others are accountless or direct-auth sources such as `web`, `amazon-s3`, `azure-blob`, `discord`, `productlane-*`, `trello`, `asana`, `fireflies`, and `fathom`. For history-capable sources, create prepares both the historical import source and the new-data monitoring sidecar. |
| **Library VFS** | The read-only virtual filesystem mounted at `/library`, exposed through `durable fs ls`, `cat`, `grep`, `sgrep`, `find`, and `stat`. VFS paths are derived from Graphlit content metadata and facets. |
| **MCP connector** | An external MCP server connection managed through the top-level `durable connectors ...` group. |
| **Channel provider** | A messaging, chat, email, messaging-phone, or voice integration managed through `durable channels ...`. Provider examples include Slack, Teams, Discord, Telegram, Google Chat, WhatsApp, email, iMessage/messaging, and voice. |
| **Endpoint** | A discovered bindable destination under a configured channel provider. |
| **Email inbox** | A Durable-hosted AgentMail inbox created with `durable channels email create`. Omit `--username` to let Durable allocate an address; requested usernames live in one global `durableagents.ai` namespace and can collide. |
| **Voice number** | A Twilio-backed inbound phone number managed with `durable channels voice numbers ...` and bound to an agent as a `voice` endpoint so a user can call the agent. |

## Quick Decision Guide

- **Need the fastest path from install to a working session?** Load `references/quickstart.md`.
- **Need to know the exact command family for accounts, sources, content, VFS, channels, or connectors?** Load `references/command-surface.md`.

## Default CLI Path

1. Install the CLI and verify the binary.
2. Authenticate with `durable login`.
3. Confirm the active account with `durable whoami` and `durable status`.
4. If the workflow needs synced external content, either connect a source account with `durable accounts connect` or create a direct-auth/accountless source with `durable sources create ...`. Source-account OAuth defaults to read access; use `--enable read,write` only when the account must support action/write tools.
5. Use `durable sources discover` when the provider resource is not obvious and the CLI needs to resolve repos, channels, calendars, folders, or databases. For GitHub sources, discovery is helpful for browsing but source creation can use `--repo owner/repo` or `--repo https://github.com/owner/repo` directly when the repository is already known.
6. Create a persona if the agent needs explicit instructions.
7. Create an agent with its core behavior. Interactive agents default to promptless chat agents. For automation agents known at create time, include `--mode scheduled --cron ...`, `--mode heartbeat --every ...`, or `--mode triggered ...`; Durable supplies a generic execution prompt when one is omitted, and `--prompt ...`/`--prompt-file ...` overrides it when you already know the automation. To convert an existing interactive agent into a scheduled agent, use `durable agents schedule <agent> --cron ... --prompt ...` or `--prompt-file ...`.
8. Load context with `durable library ingest`, `durable library upload`, or `durable sources create`. After async source creation, use `durable library wait` when the next scripted step must wait for matching Library content.
9. Bind channels with `durable channels bind` when the agent should receive or deliver work through Slack, email, messaging, or another provider.
10. Use `durable agents prompt` for the first user turn on an interactive agent. This creates a new run.
11. For follow-up turns on an interactive run, use `durable runs prompt`.
12. Use `durable runs list [--agent <agent>] [--status <status>]` for recent run records used by execution state and run-control workflows; these records are retained for about 30 days after their last update.
13. Use `durable runs search "<query>" --agent <agent>` to find completed run memories by semantic/hybrid search when the run ID is not already known. Completed run memories remain searchable until deleted. The default text output is list-like: run ID, relevance, agent, creation time, title, and summary.
14. Use `durable runs view <run-id>` to open the run flow in the Durable web UI, or `durable runs view <run-id> --transcript` for the transcript. Use `--no-browser` when a coding agent or script should print the deeplink instead of launching a browser.
15. Use `durable runs events <run-id> --summary` when an operator needs a compact tool/execution timeline without paging through raw events. Run-control commands require the recent run record to still be retained.
16. Use `durable --json` when another tool or script needs machine-readable output.

## Agent Behavior

- Prefer the exact current Durable CLI syntax documented here and confirm details with `--help` when needed.
- Treat `durable agents create` as the object and automation setup command. Create-time flags such as `--mode scheduled --cron ...`, `--mode heartbeat --every ...`, and `--mode triggered --kind ... --source ...` persist background behavior on the agent.
- Treat `durable agents prompt` as the first-turn command for an already-created interactive agent. It creates a new run.
- Use `durable runs list [--agent <agent>] [--status <status>]` for recent run records. These records are retained for about 30 days after their last update and are the window for execution state and run-control commands.
- Use `durable runs search "<query>" [--agent <agent>] [--search-type hybrid|keyword|vector] [--min-relevance <score>] [--in-last <duration>]` to find completed run memories. These memories remain searchable until deleted; a search result can outlive the recent record needed by run-control commands.
- Use `durable runs prompt` for follow-up turns on an existing interactive run.
- Use `durable runs view <run-id>` to open a run flow deeplink, and `durable runs view <run-id> --transcript` for transcript view. Use `--no-browser` when a coding agent or script should print the URL.
- Use `durable runs events <run-id> --summary` for a compact, auto-paged tool/execution timeline; `--compact` and `--tools` are aliases.
- For autonomous agents, Durable defaults the execution prompt at create time when omitted. Provide better instructions with `durable agents create --prompt ...`, or update instructions later with `durable agents set <agent> prompt ...` and `durable agents set <agent> prompt --file <path>`.
- Create scheduled agents with `--mode scheduled --cron ... --timezone ...`.
- Convert an existing interactive agent into a scheduled agent with `durable agents schedule <agent> --cron "0 7 * * 1-5" --timezone America/Los_Angeles --prompt "..."` or `--prompt-file ./prompt.md`. Use `durable agents unschedule <agent>` to return it to promptless interactive mode.
- Create heartbeat agents with `--mode heartbeat --every ... --timezone ...`.
- Create content-triggered agents with `--mode triggered`, optionally filtered by repeatable `--kind <kind>` and `--source <source>`, and optionally override the default prompt with `--prompt ...`.
- Use `durable accounts connect` and `durable accounts reconnect` for source-account OAuth, not `durable connectors connect` unless the task is specifically about MCP. Omitted `--enable` defaults to read access. Use `--enable read` for explicit read-only access and `--enable read,write` for read plus action/write scopes. Do not use raw provider scopes or a standalone write access set.
- For GitHub source accounts, expect `durable accounts connect github` and `durable accounts reconnect <github-account>` to guide the browser through GitHub OAuth authorization. Create GitHub sources directly with `--repo owner/repo` or `--repo https://github.com/owner/repo`; if a private or organization repository is not accessible, install or configure the Durable Agents GitHub App repository access in GitHub settings and retry source creation.
- Use `durable sources create web --url ...` for the simplest accountless sync, `durable sources create <type> --account ...` for account-backed sync, and direct-auth flags such as `--api-key`, `--bucket`, or `--token` for sources that authenticate directly. For history-capable account-backed sources, create prepares both the historical import source and the new-data monitoring sidecar; list/get/update/delete still operate on the concrete sources.
- Use `durable library wait --source <source> [--kind <kind>] [--query <query>] --timeout <duration>` after async source creation when a demo, script, or smoke test must wait until matching content is visible through the Library API before prompting an agent.
- Use `durable library ingest` for URL or text input and `durable library upload` for local files. Attach Graphlit labels and existing collections with repeatable `--label` and `--collection`.
- Use `durable library view <content-id>` to open the content viewer deeplink, or `--no-browser` to print the URL.
- Use `durable sources discover ...` before create when the user does not already know the exact repo, channel, calendar, folder, or database identifier, but do not make GitHub source creation depend on discovery. GitHub sources can be created directly with `--repo owner/repo` or `--repo https://github.com/owner/repo`.
- If `durable sources sync <source>` reports that the source is paused, resume it first with `durable sources resume <source>`, then retry `durable sources sync <source>`.
- Use `durable channels setup ...` when a guided channel bootstrap exists. Use `durable channels create ...`, `durable channels list`, and `durable channels delete` for lower-level channel provider management.
- For Microsoft Teams channel setup, follow the exact Teams Channel Provider Checklist below before running connector or binding commands.
- For Discord channel setup, follow the exact Discord Channel Provider Checklist below before running connector or binding commands.
- For WhatsApp channel setup, follow the exact WhatsApp Channel Provider Checklist below before running connector or binding commands.
- For voice channel setup, follow the exact Voice Channel Checklist below. The current CLI flow is a human calling an agent on an inbound voice number; do not describe outbound agent-initiated calls as supported CLI behavior.
- Use `durable channels email create` without `--username` unless the workflow truly needs a vanity address. If a username is requested, treat it as globally unique under `durableagents.ai` and handle collisions.
- Use `durable channels voice status` to check whether voice setup is ready, `durable channels voice numbers search` to find available numbers, `durable channels voice numbers create --phone <number>` to add a managed number, and `durable channels voice numbers import --phone <number> --provider-number-id <PN...>` to bring an existing Twilio number into Durable voice.
- Bind voice numbers with `durable channels bind --provider voice --agent <agent> --phone <E.164-number>`; `--phone` is only an alias for `--endpoint` when `--provider voice`.
- Reserve top-level `durable connectors ...` for MCP connectors, not channel providers.
- Treat `durable fs ls`, `cat`, `grep`, `sgrep`, `find`, and `stat` as intentional shell-style wrappers over derived `/library` paths. Direct content ID inspection uses `durable library inspect <content-id>`.
- Use `--json` whenever the workflow needs to capture IDs or parse structured output.
- Use `--every` for heartbeat cadence; do not use the deprecated heartbeat-specific cadence flag.
- For triggered agents, use repeatable `--kind` for content/file kinds and repeatable `--source` for Durable data sources. Omit both to trigger on all finished content.
- Use Durable source names or GUIDs for `--source`; the CLI resolves names to source IDs before sending the API request.
- Use `durable agents unschedule <agent>` when disabling scheduled activation. Use `durable agents set <agent> mode interactive` when disabling content-triggered, heartbeat, or webhook activation.
- Use `durable agents set <agent> <property> <value>` and `durable agents clear <agent> <property>` as the lower-level mutation grammar. `durable agents update ...` remains an older compatibility surface.
- Use `--wait` and `--timeout` for scripts, tests, and operator workflows that need bounded blocking. Avoid them in marketing or setup examples unless the point is explicitly to demonstrate run-control behavior.

## Search Relevance Guidance

- `--min-relevance` is a server-side search constraint for `durable runs search`, `durable library search`, and `durable library wait --query`; it is not a client-side filter over the relevance values printed by a previous unthresholded result set.
- Do not infer a safe `--min-relevance` cutoff from a displayed top result such as `relevance=1`. The displayed score is useful for ranking within the returned result set, but rerunning with `--min-relevance 0.6` can legitimately return no matches because the threshold changes the server-side search/filtering step.
- Prefer omitting `--min-relevance` for exploratory search. Narrow first with query text, `--agent`, `--source`, `--kind`, `--label`, `--collection`, `--mention`, `--in-last`, or a VFS path. Add `--min-relevance` only when a workflow intentionally wants to discard borderline semantic matches.
- If a thresholded search returns no matches, retry the same query without `--min-relevance` before concluding that the content or run memory is missing. If a threshold is still required, raise it gradually from a low value rather than jumping from a displayed score.
- `--min-relevance` is valid only with `--search-type hybrid` or `--search-type vector`; keyword search rejects it. For `durable fs sgrep`, narrow with the path and filters rather than a relevance threshold.

## Voice Channel Checklist

When the user asks for Durable voice agent setup, treat the current CLI requirement as inbound calling: "Can I call my agent?" Do not expand the scope to outbound calls from the agent unless the installed API and CLI explicitly add that surface.

Use this KISS sequence for first-run setup:

1. Confirm Durable CLI auth with `durable status` or `durable whoami` when practical.
2. Check voice setup with `durable channels voice status`. If voice is not ready, finish workspace voice setup before buying, importing, or binding numbers.
3. Find an available number with `durable channels voice numbers search --country US [--area-code <code>]`.
4. Purchase the chosen number with `durable channels voice numbers create --phone <E.164-number> --label "<label>"`, or import an existing Twilio number with `durable channels voice numbers import --phone <E.164-number> --provider-number-id <PN...> --label "<label>"`.
5. Confirm it appears as a bindable endpoint with `durable channels endpoints --provider voice`.
6. Bind it to an agent with `durable channels bind --provider voice --agent "<agent name or id>" --phone <E.164-number>`.
7. Test by calling the number from a normal phone.

Managed number search and purchase:

```bash
durable channels voice status
durable channels voice numbers search --country US --area-code 415
durable channels voice numbers create \
  --phone +14155550123 \
  --label "Agent phone"
```

Importing an existing Twilio number requires the Twilio provider-number SID, not an account SID, messaging service SID, or phone number ID. The SID should look like `PN...`. Import verifies that the number can be used for Durable voice, verifies the SID's phone number matches `--phone`, and prepares it for inbound calls:

```bash
durable channels voice numbers import \
  --phone +14155550123 \
  --provider-number-id PN0123456789abcdef0123456789abcdef \
  --label "Agent phone"
```

List and bind:

```bash
durable channels voice numbers list
durable channels endpoints --provider voice
durable channels bind \
  --provider voice \
  --agent "<agent name or id>" \
  --phone +14155550123
```

`--phone` is a voice-only alias for `--endpoint`; these are equivalent for voice:

```bash
durable channels bind --provider voice --agent "<agent>" --phone +14155550123
durable channels bind --provider voice --agent "<agent>" --endpoint +14155550123
```

Unbind and delete:

```bash
durable channels unbind --provider voice --phone +14155550123
durable channels voice numbers delete +14155550123 --yes
```

Deleting a voice number releases the phone number and requires `--yes`. If the number is still bound to an agent, either unbind first or pass `--force`; force-delete removes the voice binding before releasing the number:

```bash
durable channels voice numbers delete +14155550123 --yes --force
```

If `durable channels endpoints --provider voice` is empty after number creation or import, check `durable channels voice numbers list` and `durable channels voice status`. If import fails, verify that `--provider-number-id` is the Twilio provider-number SID for the same E.164 phone number.

## Teams Channel Provider Checklist

When the user asks to add or bind Microsoft Teams as a Durable channel provider, treat it as a BYO Azure Bot setup. Do not treat it as Microsoft source-account OAuth, and do not use top-level `durable connectors ...`.

Ask this preflight in one message if any answer is missing:

1. What Durable workspace should the CLI be authenticated to?
2. What display name should Durable use for the Teams channel provider?
3. What is the Azure Bot Microsoft App ID? This maps to `--bot-id` or `DURABLE_TEAMS_BOT_ID`.
4. What is the Azure Bot client secret value? This maps to `--bot-password` or `DURABLE_TEAMS_BOT_PASSWORD`; explicitly ask for the secret value, not the secret ID.
5. What is the Microsoft tenant ID? This maps to `--tenant-id` or `DURABLE_TEAMS_TENANT_ID`.
6. Has the Azure Bot messaging endpoint been set to the Durable Agents service URL, such as `https://agents.graphlit.dev/api/channels/teams/messages`?
7. Has the Azure Bot's Microsoft Teams channel been enabled in Azure Bot Channels?
8. Has the Teams app package been uploaded or published in the Teams tenant?
9. Has someone sent a message to the installed bot so a Bot Framework conversation endpoint can be captured?
10. If binding now, what agent should receive Teams messages, and do we have a discovered endpoint from `durable channels endpoints --provider teams` or an opaque `{tenantId}:{conversation.id}` endpoint?

Do not proceed with `durable channels create teams` until the bot ID, client secret value, and tenant ID are available. Do not proceed with `durable channels bind --provider teams` until either endpoint discovery returns the Teams endpoint or the user provides the opaque endpoint.

Teams channel connector creation uses Bot Framework credentials and this token scope:

```text
https://api.botframework.com/.default
```

Do not ask for Microsoft Graph delegated scopes such as `ChannelMessage.Send`, `ChannelMessage.Read.All`, `Group.Read.All`, or `Team.ReadBasic.All` unless the user's task is specifically about Microsoft Teams data sources or Microsoft Teams distribution/write tools. Those are different surfaces from inbound Durable channel binding.

Prefer the low-friction setup helper when it exists. It should generate the Teams app package and create the Durable connector in one run when all credentials are supplied:

```bash
durable channels setup teams \
  --name "<display name>" \
  --bot-id "$DURABLE_TEAMS_BOT_ID" \
  --bot-password "$DURABLE_TEAMS_BOT_PASSWORD" \
  --tenant-id "$DURABLE_TEAMS_TENANT_ID"

durable channels list
```

When the user only has the bot ID or wants package-only output, use setup to generate the app ZIP without connector creation if supported:

```bash
durable channels setup teams
durable channels setup teams \
  --name "<display name>" \
  --bot-id "$DURABLE_TEAMS_BOT_ID" \
  --output ./teams-app.zip \
  --no-create
```

If `durable channels setup teams` is not available in the installed CLI, tell the user that the current fallback is connector creation plus manual package/setup guidance:

```bash
durable channels create teams \
  --name "<display name>" \
  --bot-id "$DURABLE_TEAMS_BOT_ID" \
  --bot-password "$DURABLE_TEAMS_BOT_PASSWORD" \
  --tenant-id "$DURABLE_TEAMS_TENANT_ID"

durable channels list
```

After the installed bot receives a Teams message, discover endpoints:

```bash
durable channels endpoints --provider teams
durable channels endpoints --provider teams --query "<team-or-channel-or-tenant>"
```

Bind by discovered endpoint:

```bash
durable channels bind \
  --provider teams \
  --agent "<agent name or id>" \
  --endpoint "<tenantId>:<conversation.id>"
```

If selector support exists, bind by human-readable Teams metadata:

```bash
durable channels bind \
  --provider teams \
  --agent "<agent name or id>" \
  --team "<team name>" \
  --channel "<channel name>"
```

Unbind with the same endpoint:

```bash
durable channels unbind \
  --provider teams \
  --endpoint "<tenantId>:<conversation.id>"
```

If endpoint discovery is empty, the next action is external: confirm the Azure Bot messaging endpoint, Teams channel enablement, app upload/publish, and that a message has been sent to the bot. Do not invent a Microsoft Graph discovery workaround for inbound Teams channel binding.

## Discord Channel Provider Checklist

When the user asks to add or bind Discord as a Durable channel provider, treat it as a BYO Discord Application/Bot setup. Do not treat it as Discord source-account OAuth, do not use top-level `durable connectors ...`, and do not ask for Message Content Intent. The Durable Discord channel uses HTTP interactions and slash commands, not the Discord gateway message stream.

Use this KISS sequence for first-run setup:

1. Confirm Durable CLI auth with `durable status` or `durable whoami` when practical. Ask the user only if the CLI is not authenticated or the workspace looks wrong.
2. Collect the minimum setup inputs: display name, Discord Application ID, Discord Interactions Public Key, and Discord Bot Token. Prefer environment variables for secrets instead of asking the user to paste token values into chat.
3. Run `durable channels setup discord` with those values. Use `--guild-id` only when the user already has a target guild or the workflow is a smoke test that needs immediate guild-scoped command propagation.
4. Have the user install the bot from the generated invite URL.
5. Run endpoint discovery.
6. Bind the discovered endpoint to the target agent.
7. Test with `/ask prompt: READY`.

Ask only for missing values at the step where they are needed:

- Setup requires a Durable display name, `--application-id` or `DURABLE_DISCORD_APPLICATION_ID`, `--public-key` or `DURABLE_DISCORD_PUBLIC_KEY`, and `--bot-token` or `DURABLE_DISCORD_BOT_TOKEN`.
- Guild-scoped setup accepts `--guild-id` or `DURABLE_DISCORD_GUILD_ID`, but omit it for the default global command path.
- Binding requires the target agent and either a discovered endpoint from `durable channels endpoints --provider discord` or an opaque `{guildId}:{channelId}` endpoint.

Do not proceed with `durable channels create discord` until the Application ID, Interactions Public Key, and Bot Token are available. Do not proceed with `durable channels bind --provider discord` until either endpoint discovery returns the Discord endpoint or the user provides the opaque endpoint.

Default the command name to `ask` and the option name to `prompt`. Do not ask the user to choose command names unless they explicitly need a non-default command.

Prefer the low-friction setup helper when it exists. It should create or update the Durable connector, register or repair the Discord interactions endpoint, register or repair `/ask prompt:<message>`, print the generated invite URL, and print the next endpoint discovery and binding commands:

```bash
durable channels setup discord \
  --name "<display name>" \
  --application-id "$DURABLE_DISCORD_APPLICATION_ID" \
  --public-key "$DURABLE_DISCORD_PUBLIC_KEY" \
  --bot-token "$DURABLE_DISCORD_BOT_TOKEN"
```

For fast smoke tests, register the command in a specific guild so Discord command propagation is immediate:

```bash
durable channels setup discord \
  --name "<display name>" \
  --application-id "$DURABLE_DISCORD_APPLICATION_ID" \
  --public-key "$DURABLE_DISCORD_PUBLIC_KEY" \
  --bot-token "$DURABLE_DISCORD_BOT_TOKEN" \
  --guild-id "$DURABLE_DISCORD_GUILD_ID"
```

For repair flows, keep setup as the operator command rather than asking the user to hand-edit Discord settings. Do not show these flags in the first-run path. Use `--skip-create` when the Durable connector already exists and setup should only repair Discord-side state, `--skip-command` when command registration should be skipped, and `--force-command` when the command definition should be overwritten:

```bash
durable channels setup discord \
  --name "<display name>" \
  --application-id "$DURABLE_DISCORD_APPLICATION_ID" \
  --public-key "$DURABLE_DISCORD_PUBLIC_KEY" \
  --bot-token "$DURABLE_DISCORD_BOT_TOKEN" \
  --skip-create \
  --force-command
```

The supported Discord user command is:

```text
/ask prompt:<message>
```

If the user only has the Application ID, setup should still be useful: print the Durable interactions endpoint URL, generated invite URL, missing credentials, and exact next commands. It must not pretend connector creation, endpoint registration, or command registration succeeded until all required credentials are present.

If `durable channels setup discord` is not available in the installed CLI, tell the user that the current fallback is connector creation plus manual Discord setup guidance. Do not call the Discord channel shippable from the fallback alone unless endpoint registration and slash-command registration are already handled elsewhere:

```bash
durable channels create discord \
  --name "<display name>" \
  --application-id "$DURABLE_DISCORD_APPLICATION_ID" \
  --public-key "$DURABLE_DISCORD_PUBLIC_KEY" \
  --bot-token "$DURABLE_DISCORD_BOT_TOKEN"

durable channels list
```

After the bot is installed into a Discord server, discover endpoints:

```bash
durable channels endpoints --provider discord
durable channels endpoints --provider discord --query "<server-or-channel-name>"
```

Bind by discovered endpoint:

```bash
durable channels bind \
  --provider discord \
  --agent "<agent name or id>" \
  --endpoint "<guildId>:<channelId>"
```

If selector support exists, bind by human-readable Discord metadata:

```bash
durable channels bind \
  --provider discord \
  --agent "<agent name or id>" \
  --workspace "<server name>" \
  --channel "<channel name>"
```

Unbind with the same endpoint:

```bash
durable channels unbind \
  --provider discord \
  --endpoint "<guildId>:<channelId>"
```

For a first real test, ask the user to run this in the bound Discord channel:

```text
/ask prompt: READY
```

If endpoint discovery is empty, the next action is external: open the generated Discord invite URL, install the bot into the target server, confirm the bot has `View Channels`, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, and `Use Application Commands`, and rerun endpoint discovery. If the command is missing in Discord, rerun the setup helper to repair command registration instead of asking the user to hand-create the command.

## WhatsApp Channel Provider Checklist

When the user asks to add or bind WhatsApp as a Durable channel provider, treat it as a BYO Meta WhatsApp Cloud API setup. Do not treat it as source-account OAuth, do not use top-level `durable connectors ...`, and do not ask for consumer WhatsApp credentials. The Durable WhatsApp channel receives normal inbound messages sent to a WhatsApp Business phone number and replies through the Meta Graph API.

Use this KISS sequence for first-run setup:

1. Confirm Durable CLI auth with `durable status` or `durable whoami` when practical. Ask the user only if the CLI is not authenticated or the workspace looks wrong.
2. Collect the minimum setup inputs: display name, WhatsApp Phone Number ID, and permanent Meta access token. Prefer environment variables for secrets instead of asking the user to paste token values into chat.
3. Run `durable channels setup whatsapp`. Let setup generate a verify token when one is not supplied. Include `--app-secret` when the user has it so runtime signature verification can be enabled.
4. Have the user paste the callback URL and verify token from setup output into Meta's WhatsApp webhook configuration, then subscribe the webhook to the `messages` field.
5. Run endpoint discovery. The bindable endpoint should be the configured `phoneNumberId`.
6. Bind the WhatsApp endpoint to the target agent. If there is only one WhatsApp endpoint, prefer the no-endpoint bind.
7. Test by sending `READY` from WhatsApp to the business phone number.

Ask only for missing values at the step where they are needed:

- Setup requires a Durable display name, `--phone-number-id` or `DURABLE_WHATSAPP_PHONE_NUMBER_ID`, and `--access-token` or `DURABLE_WHATSAPP_ACCESS_TOKEN`.
- Setup accepts `--verify-token` or `DURABLE_WHATSAPP_VERIFY_TOKEN`; if omitted, setup should generate one and print it for the Meta webhook form.
- Setup accepts `--app-secret` or `DURABLE_WHATSAPP_APP_SECRET`; strongly prefer it for signed webhook verification, but do not block first-run setup if the user cannot find it yet.
- Binding requires the target agent. Use `--endpoint` only when endpoint discovery returns multiple WhatsApp endpoints or the user provides an explicit `phoneNumberId`.

Do not proceed with `durable channels create whatsapp` until the access token and Phone Number ID are available. Do not ask the user for a recipient phone number during channel setup; sender phone numbers appear only after users message the WhatsApp Business number.

Prefer the low-friction setup helper when it exists. It should print the webhook callback URL, generate or echo the verify token, validate the access token and Phone Number ID, create or update the Durable connector, make the `phoneNumberId` endpoint discoverable immediately, and print the next endpoint discovery and binding commands:

```bash
durable channels setup whatsapp \
  --name "<display name>" \
  --phone-number-id "$DURABLE_WHATSAPP_PHONE_NUMBER_ID" \
  --access-token "$DURABLE_WHATSAPP_ACCESS_TOKEN" \
  --verify-token "$DURABLE_WHATSAPP_VERIFY_TOKEN" \
  --app-secret "$DURABLE_WHATSAPP_APP_SECRET"
```

If the verify token is not already chosen, omit it and use the generated value from setup output in Meta:

```bash
durable channels setup whatsapp \
  --name "<display name>" \
  --phone-number-id "$DURABLE_WHATSAPP_PHONE_NUMBER_ID" \
  --access-token "$DURABLE_WHATSAPP_ACCESS_TOKEN" \
  --app-secret "$DURABLE_WHATSAPP_APP_SECRET"
```

After the Meta webhook is verified and subscribed to `messages`, discover endpoints:

```bash
durable channels endpoints --provider whatsapp
durable channels endpoints --provider whatsapp --query "$DURABLE_WHATSAPP_PHONE_NUMBER_ID"
```

Bind the single configured WhatsApp endpoint to an agent:

```bash
durable channels bind \
  --provider whatsapp \
  --agent "<agent name or id>"
```

If endpoint selection is ambiguous, bind explicitly by Phone Number ID:

```bash
durable channels bind \
  --provider whatsapp \
  --agent "<agent name or id>" \
  --endpoint "$DURABLE_WHATSAPP_PHONE_NUMBER_ID"
```

Unbind with the same endpoint:

```bash
durable channels unbind \
  --provider whatsapp \
  --endpoint "$DURABLE_WHATSAPP_PHONE_NUMBER_ID"
```

For a first real test, ask the user to send this normal WhatsApp message to the configured business number:

```text
READY
```

If `durable channels setup whatsapp` is not available in the installed CLI, tell the user that the current fallback is connector creation plus manual Meta webhook setup guidance:

```bash
durable channels create whatsapp \
  --name "<display name>" \
  --phone-number-id "$DURABLE_WHATSAPP_PHONE_NUMBER_ID" \
  --access-token "$DURABLE_WHATSAPP_ACCESS_TOKEN" \
  --verify-token "$DURABLE_WHATSAPP_VERIFY_TOKEN" \
  --app-secret "$DURABLE_WHATSAPP_APP_SECRET"

durable channels endpoints --provider whatsapp
durable channels bind --provider whatsapp --agent "<agent name or id>"
```

If endpoint discovery is empty after connector creation, check that the connector was created successfully and that the Phone Number ID was stored. Unlike Teams, WhatsApp does not need a first inbound message to discover the phone-number endpoint in Durable. If inbound test messages do not produce replies, check Meta webhook callback URL, verify token, `messages` field subscription, app secret/signature errors, and the WhatsApp 24-hour customer-service window.

## Rules

- Use `durable accounts ...` for source-account OAuth and `durable sources ...` for data-source management.
- Use `durable connectors ...` only for MCP connector management.
- Treat `durable fs ...` commands as reads against Graphlit content through derived paths: `/library` for navigation, `/library/contents` for all content, `/library/<content-id>` for canonical item paths, `/library/contents/<content-id>` for item paths under the flat content view, `/library/labels/<label-ref>`, `/library/collections/<collection-ref>`, `/library/kind/<kind>`, `/library/mentions/<mention-kind>/<mention-ref>`, and `/library/sources/<source-ref>`.
- Do not use lookup-only mention kind parent paths such as `/library/mentions/email` or `/library/mentions/phone`; they are invalid commands. Use a concrete value path such as `/library/mentions/email/<encoded-email>`, or use `--mention email:<address>` on Library/VFS filters.
- Use `durable fs grep` for keyword/lexical Graphlit content search and `durable fs sgrep` for semantic/hybrid Graphlit content search.
- Use `durable fs stat <path>` for VFS path metadata and `durable library inspect <content-id>` for Markdown-formatted full content inspection by content ID.
- Use `durable library view <content-id>` for the browser content viewer; keep `durable library inspect <content-id>` for terminal Markdown inspection.
- For Library ingest, use exactly one of `--url` or `--text`.
- For Library filters, prefer repeatable `--source`, `--kind`, `--collection`, and `--mention <kind>:<ref>`. Use `--in-last <duration>` with `--date-mode added|authored` for date added/date authored windows. `kind` resolves as Graphlit content type first, then file type, then exact file extension/format aliases such as `pdf`; there is no separate `--format` flag.
- Supported mention lookup namespaces are `email` and `phone`, but only with a reference value; entity mention kinds include `person`, `organization`, `place`, `product`, `repo`, `software`, `event`, `category`, `emotion`, `investment`, `investment-fund`, and the medical entity kinds.
- Use GUIDs captured from `--json` output for object-specific automation when precision matters.
- If a workflow spans auth, source setup, agent creation, Library ingest, and execution, load both references before writing commands.

## Agent Property Grammar

Prefer the intent-level helpers for common automation changes:

```bash
durable agents schedule <agent> \
  --cron "0 7 * * 1-5" \
  --timezone America/Los_Angeles \
  --prompt "Run the daily account sweep."

durable agents schedule <agent> \
  --cron "0 7 * * 1-5" \
  --prompt-file ./prompt.md

durable agents unschedule <agent>
```

Use the regular property grammar for agent edits:

```bash
durable agents set <agent> prompt "Run the daily account sweep."
durable agents set <agent> prompt --file ./prompt.md
durable agents set <agent> focus "Only use Q4 customer content."
durable agents set <agent> schedule.cron "0 7 * * 1-5"
durable agents set <agent> trigger.kinds text page
durable agents clear <agent> focus
durable agents clear <agent> trigger.kinds
```

- Scalar values are positional by default; do not invent `--value`.
- List values use repeated positional values, not comma-separated strings.
- `--file` is for string properties such as `prompt`, `focus`, and `description`.
- The global `--json` flag controls output only; it is not an input-value parser.
- Source refs in `trigger.sources` should be explicit Durable source IDs. Older `agents update --source <name>` compatibility can still resolve names.

| Property | Value | Clear |
| --- | --- | --- |
| `name` | string | no |
| `description` | string | yes |
| `state` | `enabled`, `disabled` | no |
| `mode` | `interactive`, `heartbeat`, `scheduled`, `triggered`, `webhook` | no |
| `model` | model preset or specification ID | yes |
| `effort` | `quick`, `standard`, `deep`, `exhaustive` | yes |
| `persona` | persona ID | yes |
| `prompt` | string or `--file` | context-dependent |
| `focus` | string or `--file` | yes |
| `trigger.kinds` | repeated kind values | yes |
| `trigger.sources` | repeated source IDs | yes |
| `schedule.cron` | string | yes |
| `schedule.timezone` | IANA timezone | yes |
| `schedule.recurrence_type` | `monitor`, `once`, `repeat` | yes |
| `schedule.repeat_interval` | string | yes |
| `heartbeat.frequency_minutes` | number | no |
| `heartbeat.off_hours_frequency_minutes` | number | yes |
| `heartbeat.active_hours_start` | time string | no |
| `heartbeat.active_hours_end` | time string | no |
| `heartbeat.active_days` | repeated 0-6 day numbers | no |
| `heartbeat.timezone` | IANA timezone | no |
| `heartbeat.probe_thresholds.new_content_min` | number | yes |
| `heartbeat.probe_thresholds.volume_spike_multiplier` | number | yes |

Older CLI aliases:

- `durable agents update <agent> --prompt "..."` maps to `agents set <agent> prompt "..."`
- `durable agents update <agent> --prompt-file ./prompt.md` maps to `agents set <agent> prompt --file ./prompt.md`
- `durable agents update <agent> --focus "..."` maps to `agents set <agent> focus "..."`
- `durable agents update <agent> --clear-focus` maps to `agents clear <agent> focus`
- `durable agents update <agent> --clear-trigger --mode interactive` maps to `agents set <agent> mode interactive`
