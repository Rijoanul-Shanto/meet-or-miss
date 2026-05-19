# meetings-reminder

[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](tsconfig.json)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-f9f1e1.svg)](.bun-version)

Google Apps Script that posts Discord webhook notifications before Google
Calendar meetings start. Built in TypeScript, bundled with `Bun.build`,
tested with `bun test`, deployed via [clasp](https://github.com/google/clasp).

## Features

- Multi-stage alerts (default: 10, 5, and 0 minutes before start)
- Routes title matches and creator matches to separate Discord channels
- Scans every calendar the user has access to, not just primary
- Idempotent dedupe via Script Properties prevents double-fires across
  overlapping trigger runs
- Auto-pruning dedupe store (24h TTL)
- Exponential-backoff retry on Discord 429 / 5xx
- Three-tier Meet link resolution: Advanced Calendar API → location → description
- Health-check function for verifying setup

## Architecture

```
        Time trigger (every minute)
                 │
                 ▼
    checkUpcomingMeetings()         healthCheck()
                 │                       │
                 ▼                       ▼
        ┌────────────────┐      ┌────────────────┐
        │ EventProcessor │      │ PropertiesStore│
        └───────┬────────┘      └────────────────┘
                │
   ┌────────────┼────────────┐──────────────┐
   ▼            ▼            ▼              ▼
CalendarSvc  DedupeStore  MeetLinkExtr  WebhookClient
   │            │            │              │
   ▼            ▼            ▼              ▼
CalendarApp  Properties  Calendar API  UrlFetchApp
```

## Setup

### 1. Install Bun and dependencies

```bash
curl -fsSL https://bun.sh/install | bash    # if Bun isn't installed
bun install
bun x clasp login
```

### 2. Link to an Apps Script project

Create a new one:

```bash
bun run build
cd dist && bun x clasp create --title "meetings-reminder" --type standalone && cd ..
```

Or paste an existing scriptId into `.clasp.json`:

```json
{ "scriptId": "YOUR_SCRIPT_ID_HERE", "rootDir": "./dist" }
```

### 3. Push the manifest and code

```bash
bun run push       # runs build + clasp push -f
```

### 4. Enable the Advanced Calendar Service

In the Apps Script editor: **Services → Add → Google Calendar API → Add**

### 5. Store webhook URLs in Script Properties

**Project Settings (gear icon) → Script Properties → Add script property**

| Key | Value |
|---|---|
| `TITLE_WEBHOOK_URL`   | `https://discord.com/api/webhooks/...` |
| `CREATOR_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` |

Webhook URLs are never committed to source. Rotate by editing these values.

### 6. Verify setup

In the editor, run `healthCheck` once and check the logs. It will report:

- whether Script Properties are set
- whether `CalendarApp` is reachable
- whether the Advanced Calendar service is reachable

### 7. Install the time trigger

**Triggers → Add Trigger**

- Function: `checkUpcomingMeetings`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every minute

## Daily workflow

```bash
bun run build:watch   # rebuild on every change
bun run logs          # tail execution logs
bun run open          # open project in the Apps Script editor
bun run push          # ship to GAS
```

No `clasp deploy` needed — time-driven triggers always execute `HEAD`.

## Configuration

Edit `src/config.ts`:

| Field | Purpose |
|---|---|
| `notifyMinutesBefore` | Alert offsets, in minutes |
| `targetTitles`        | Meeting titles to match (lowercase, exact) |
| `targetCreators`      | Creator emails to match (lowercase) |
| `searchWindowMs`      | Half-width of the search window around each offset |
| `dedupeTtlMs`         | Sent-marker retention before auto-prune |

Routing:

| Event matches | Sent to |
|---|---|
| Title only       | `TITLE_WEBHOOK_URL` |
| Creator only     | `CREATOR_WEBHOOK_URL` |
| Both             | `TITLE_WEBHOOK_URL` (title wins) |

## Development

```bash
bun run verify        # lint + typecheck + tests
bun test --coverage   # tests with coverage report
bun run lint:fix      # auto-fix lint errors
bun run format        # prettier write
```

### Project layout

```
src/
  appsscript.json       Manifest (timezone, services, scopes)
  index.ts              Bundle entrypoint (attaches to globalThis)
  main.ts               checkUpcomingMeetings()
  healthCheck.ts        Diagnostic entrypoint
  config.ts             Constants, regex, property keys
  types.ts              Shared interfaces
  logger.ts             Structured logger
  propertiesStore.ts    Wrapper for PropertiesService
  dedupeStore.ts        Sent-marker store with TTL prune
  calendarService.ts    Multi-calendar event reader
  meetLinkExtractor.ts  3-tier Meet link resolver
  eventProcessor.ts     Match → dedupe → route → send
  webhookClient.ts      Discord client with retry
test/
  setup.ts              GAS global stubs (loaded via bunfig.toml)
  helpers.ts            Fake PropertiesService + event builders
  *.test.ts             Per-module behavior tests
build.ts                Bun.build bundler
bunfig.toml             Bun config (test preload)
```

### Why Bun

- One toolchain: package manager, TS runner, test runner, bundler
- No `ts-jest`, no `esbuild`, no transpile config — bun runs TS directly
- Test startup ~10× faster than jest on this project size
- `bun install` ~20× faster than `npm install`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md). Report vulnerabilities through GitHub's
private vulnerability reporting flow.

## License

[MIT](LICENSE).
