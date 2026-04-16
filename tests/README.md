# Playwright Tests

## Setup

```bash
npm install
```

## Standard Tests

Validates form filling, auto-select behavior, validation errors, submission payload, cancel button, and dark/light mode. The Apps Script endpoint is intercepted so no real emails are sent.

```bash
npx playwright test
```

## Real Submission Test

Fills and submits the form to the actual Apps Script endpoint so you can verify the email arrives. Excluded from the standard test run.

```bash
RUN_REAL=1 npx playwright test tests/submit-real.spec.js --headed
```
