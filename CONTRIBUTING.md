# Contributing

Thanks for considering a contribution.

## Quick start

```bash
curl -fsSL https://bun.sh/install | bash   # if Bun isn't installed yet
bun install
bun run verify                              # lint + typecheck + tests
```

## Workflow

1. Fork and create a feature branch.
2. Make changes. Add or update tests for any behavior change.
3. Run `bun run verify` and `bun run build`.
4. Commit with a Conventional Commits message (`feat:`, `fix:`, `refactor:`, etc.).
5. Open a pull request against `main`. Fill in the PR template.

## Project layout

| Path | Purpose |
|---|---|
| `src/` | TypeScript source — strict mode, modular, dependency-injected |
| `test/` | `bun:test` tests with Apps Script globals stubbed in `test/setup.ts` |
| `build.ts` | `Bun.build` bundler — produces `dist/Code.js` for clasp |
| `dist/` | Build output, not committed |
| `appsscript.json` | Apps Script manifest, lives under `src/` and copied to `dist/` |

## Coding conventions

- Strict TypeScript. No `any` unless justified with a comment.
- Dependency injection at construction time — modules should be testable in isolation.
- Logging through `logger` from `src/logger.ts`. Use structured context objects, not string concatenation.
- One responsibility per file. Class names match file names (PascalCase for classes, camelCase for files).
- Public API surface lives in `src/index.ts`. Add a footer entry in `build.ts` for any function that must be callable from the Apps Script trigger UI.

## Tests

- Tests run under `bun test` with Google Apps Script globals stubbed by `test/setup.ts` (preloaded via `bunfig.toml`).
- Use `FakePropertiesService` from `test/helpers.ts` for `PropertiesStore`-backed code.
- Aim for behavior coverage of the routing, dedupe, window, and retry paths.

## Submitting

- Keep PRs focused. One concern per PR.
- Update `CHANGELOG.md` under `## [Unreleased]`.
- If you add user-facing config or behavior, update `README.md`.

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Vulnerabilities should be reported privately. See [SECURITY.md](SECURITY.md).
