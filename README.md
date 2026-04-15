# Copperview Temporary Building Access Form

A web form for requesting temporary building access for church stake buildings. Hosted on GitHub Pages with a Google Apps Script backend for email notifications and spreadsheet tracking. 

## How It Works

1. User fills out the form (ward, building, name, email, dates/times, purpose)
2. Form submits data to a Google Apps Script backend
3. Apps Script writes the entry to the appropriate ward tab in a Google Spreadsheet
4. Apps Script sends an email notification to the building manager

## Project Structure

- `index.html` — Form markup
- `styles.css` — Styling (dark/light mode support)
- `app.js` — Form logic, validation, and submission
- `config.js` — Stake name, buildings, and ward assignments
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
- Cancel confirmation when form has data
- Scroll to error/success messages on mobile
- Browser autofill styled to match dark/light theme
- Mobile responsive
- Email notifications to building managers
- Entries logged to Google Spreadsheet
- Test mode via `?test=true` URL parameter for quick form testing

## Running Tests

Open `tests.html` in a browser to run the unit tests. No dependencies required.
