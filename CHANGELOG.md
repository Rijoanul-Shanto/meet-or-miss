# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-19

### Added

- Initial TypeScript port with dependency-injected modules:
  `PropertiesStore`, `DedupeStore`, `WebhookClient`, `MeetLinkExtractor`,
  `CalendarService`, `EventProcessor`.
- Discord webhook delivery with exponential-backoff retry on 429 and 5xx.
- Dedupe via Script Properties with 24h TTL prune.
- Multi-calendar scan (all calendars the user has access to).
- Health-check function for verifying setup.
- `Bun.build` bundler that ships a single `dist/Code.js` for clasp.
- `bun:test` test suite with mocked Apps Script globals.
- GitHub Actions CI (lint, typecheck, test, build) running on Bun.
- ESLint + Prettier + EditorConfig + strict tsconfig.
- Issue templates, PR template, Dependabot, MIT license, code of conduct,
  security policy.

### Security

- Webhook URLs are loaded from Apps Script Properties at runtime. No secrets
  in source.
