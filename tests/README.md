# Playwright Tests

## Setup

```bash
npm install
```

## Standard Tests

Validates form filling, field toggling by request type, validation errors, submission payload, failure handling (403 / 500 / network), cancel button, and dark/light mode. The Apps Script endpoint is intercepted so no real emails are sent.

```bash
npx playwright test
```

## Real Submission Test

Fills and submits the form to the actual Apps Script endpoint. Excluded from the standard test run.

```bash
RUN_REAL=1 npx playwright test tests/submit-real.spec.js --headed
```

**This sends a real email.** It uses 8th Ward + Stake Center, which routes to the owner rather than to one of the other building managers. Keep it that way — changing the ward or building would email a real person on every run.

It must select `#building` explicitly. That field is `required`, and nothing auto-fills it from the ward (auto-select was removed in commit 2613a11), so omitting it makes `checkValidity()` fail and the form never submits — the test just times out.

Note that `RUN_REAL=1` unignores **all three** excluded specs, not only this one. Name the spec file explicitly, as above, or you will also drive the Kindoo UI.

## Kindoo Specs

`export-users.spec.js` and `submit-batch.spec.js` drive the live Kindoo web UI — the second one creates a real user with an access rule. Both need `KINDOO_EMAIL`, `KINDOO_USERNAME`, and `KINDOO_PASSWORD` in the environment.

## Unit Test Page

`tests.html` is a standalone browser page, no runner. Serve it **without** `-s`:

```bash
npx serve -l 3001 .   # then open http://localhost:3001/tests/tests.html
```

The Playwright config uses `serve -s .`, whose SPA rewrite silently returns `index.html` instead. All assertions run in one inline `<script>`, so a single `ReferenceError` aborts the rest and leaves the summary blank — which reads as "nothing happened" rather than as a failure.

## Endpoint Monitoring

The Apps Script backend is monitored continuously by Uptime Kuma (`BldgAccess Apps Script`), which POSTs a no-op payload and asserts the success message in the response. See `building-access.md` in the homelab-docs repo.
