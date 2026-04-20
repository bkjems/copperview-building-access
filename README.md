# Copperview Temporary Building Access Form
<!-- cSpell:ignore Copperview -->

A web form for requesting temporary building access for church stake buildings. Hosted on GitHub Pages with a Google Apps Script backend for email notifications.

## How It Works

1. User selects a ward, building, and request type
2. Based on the request type, the appropriate fields are shown:
   - **Building Access** — name, email, dates/times, purpose
   - **Schedule Building Lockup** — bulk information textarea (name, email, date range)
   - **Update (s)** — bulk information textarea (name, email, calling)
3. Form submits data to a Google Apps Script backend
4. Apps Script sends an email notification to the building manager

## Project Structure

- `index.html` — Form markup
- `styles.css` — Styling (dark/light mode support)
- `app.js` — Form logic, validation, and submission
- `config.js` — Stake name, buildings, and ward assignments
- `apps_script/code.gs` — Google Apps Script backend (form handler, email notifications)
- `tests.html` — Unit tests (open in browser to run)

## Configuration

Edit `config.js` to customize for your stake:

```javascript
var CONFIG = {
  stakeName: "Your Stake Name",
  buildings: [
    {
      name: "Building A",
      wards: ["1st Ward", "2nd Ward"]
    },
    {
      name: "Building B",
      wards: ["3rd Ward", "4th Ward"]
    }
  ]
};
```

## Apps Script Setup

1. Open your Google Spreadsheet
2. Go to **Extensions > Apps Script**
3. Add the `doGet`, `doPost`, and `submitForm` functions from `code.gs`
4. Configure the `emailMap` in Apps Script with building manager email addresses (kept private, not in this repo)
5. Deploy as a **Web app** (Execute as: Me, Access: Anyone)
6. Update `APPS_SCRIPT_URL` in `app.js` with your deployment URL

## Kindoo Bulk Import

### Setup

```bash
npm install
```

Create a `.env` file with your Kindoo/LDS credentials:

```
KINDOO_EMAIL=your-email@example.com
KINDOO_USERNAME=your-lds-username
KINDOO_PASSWORD=your-lds-password
```

## Features

- **Request type dropdown** — dynamically shows/hides fields based on selection
- Dark/light mode toggle
- Auto-selects building based on ward
- Date validation (no past dates, end date must be after start date)
- Same-day time validation (end time must be after start time)
- Default start time (8:00 AM) and end time (10:00 PM)
- Auto-fills end date to match start date
- Date picker min date set to today (prevents past date selection)
- Input length limits (Name: 100, Email: 254, Purpose: 500)
- Whitespace trimming on text inputs
- Submit button disabled during submission to prevent duplicates
- Success message auto-clears after 7 seconds
- Cancel confirmation when form has data — resets to initial view
- Scroll to error/success messages on mobile
- Browser autofill styled to match dark/light theme
- Mobile responsive
- Email notifications to building managers with dynamic subject/heading based on request type
- Test mode via `?test=<number>` URL parameter for quick form testing:
  - `?test=1` — Building Access with sample date/time data
  - `?test=2` — Schedule Building Lockup with sample lockup entries
  - `?test=3` — Update Custom Calling(s) with sample calling entries

## Running Tests

Open `tests.html` in a browser to run the unit tests. No dependencies required.
