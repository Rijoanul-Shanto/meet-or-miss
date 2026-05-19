# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| latest `main` | ✅ |
| anything else | ❌ |

This is a single-script project; only the current `main` branch receives fixes.

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Fill in the form — include reproduction steps and impact.

You will get an acknowledgement within 7 days. We aim to ship a fix within
30 days for high-severity issues.

## Scope

In scope:

- Code that ships in `src/`
- Build pipeline (`build.mjs`)
- CI workflows under `.github/workflows/`

Out of scope:

- Vulnerabilities in Google Apps Script itself — report to Google.
- Vulnerabilities in Discord webhook handling — report to Discord.
- Misconfiguration of a user's own Script Properties or trigger setup.

## Secret handling

Webhook URLs are configured at runtime through Apps Script Properties. They are
never embedded in source. If you discover any commit that does contain a real
webhook URL, treat it as a leak: rotate the URL in Discord immediately, then
report.
