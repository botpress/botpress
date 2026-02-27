# Google Sheets Knowledge Base Sync

Automatically sync data from your public Google Sheets to Botpress Knowledge Base.

## Setup

1. **Make your Google Sheet public**:
   - Open your Google Sheet
   - Click "Share" → "Change to anyone with the link"
   - Set permissions to "Viewer"

2. **Get your sheet URL**:
   - Copy the full URL from your browser
   - Example: `https://docs.google.com/spreadsheets/d/1abc123.../edit?gid=456789#gid=456789`

3. **Configure the integration**:
   - **Sheet URL**: Paste your Google Sheets URL
   - **Knowledge Base ID**: Your target KB ID

4. **Save and sync**:
   - Click "Save Configuration" to automatically sync all data
   - Use the "Sync KB" action anytime to refresh the data

## How it works

- Each row becomes a separate file in your Knowledge Base
- First row is treated as column headers
- Data is stored as JSON with proper tagging for easy management
- Existing data is replaced on each sync to keep everything current

## Supported URLs

Both URL formats work:

- Full URL with sheet ID: `...edit?gid=123456#gid=123456`
- Share URL: `...edit?usp=sharing` (uses first sheet)

That's it! Your Google Sheets data will now be available in your Knowledge Base.
