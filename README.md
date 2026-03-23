# Temporary Building Access Form

A web form for requesting temporary building access for church stake buildings. Hosted on GitHub Pages with a Google Apps Script backend for email notifications and spreadsheet tracking.

## How It Works

1. User fills out the form (ward, building, name, email, dates/times)
2. Form submits data to a Google Apps Script backend
3. Apps Script writes the entry to the appropriate ward tab in a Google Spreadsheet
4. Apps Script sends an email notification to the building manager

## Project Structure

- `index.html` — Form markup
- `styles.css` — Styling (dark/light mode support)
- `app.js` — Form logic, validation, and submission
- `config.js` — Stake name, buildings, and ward assignments

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
3. Add the `doGet`, `doPost`, and `submitForm` functions
4. Configure the `emailMap` in Apps Script with building manager email addresses (kept private, not in this repo)
5. Deploy as a **Web app** (Execute as: Me, Access: Anyone)
6. Update `APPS_SCRIPT_URL` in `app.js` with your deployment URL

## Features

- Dark/light mode toggle
- Auto-selects building based on ward
- Date validation (no past dates, end date must be after start date)
- Default start time (10:00 AM) and end time (10:00 PM)
- Mobile responsive
- Email notifications to building managers
- Entries logged to Google Spreadsheet
