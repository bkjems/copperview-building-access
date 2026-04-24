# Copperview Temporary Building Access Form
<!-- cSpell:ignore Copperview -->

A web form for requesting temporary building access for church stake buildings. Hosted on GitHub Pages with a Google Apps Script backend for email notifications.

## How It Works

1. User selects a ward, building, and request type
2. Based on the request type, the appropriate fields are shown:
   - **Building Access** — name, email, free-text information (dates, times, purpose)
   - **Schedule Building Lockup** — bulk information textarea (name, email, date range)
   - **Update Custom Calling** — bulk information textarea (name, email, calling)
3. Form submits data to a Google Apps Script backend
4. Apps Script sends an email notification to the building manager

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

## Features

- **Request type dropdown** — dynamically shows/hides fields based on selection
- Building scheduler approval reminder for Building Access requests
- Dark/light mode toggle
- Auto-selects building based on ward
- Input length limits (Name: 100, Email: 254)
- Whitespace trimming on text inputs
- Submit button disabled during submission to prevent duplicates
- Success message auto-clears after 7 seconds
- Cancel confirmation when form has data — resets to initial view
- Scroll to error/success messages on mobile
- Browser autofill styled to match dark/light theme
- Mobile responsive
- Email notifications to building managers with dynamic subject/heading based on request type
