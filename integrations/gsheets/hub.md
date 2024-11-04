Supercharge your workflow with the Google Sheets integration, simplifying interactions with your spreadsheet data. Easily update, append, and retrieve values to keep your spreadsheets up-to-date.
From tracking inventory and managing project tasks to organizing event attendees, Google Sheets integration streamlines your data management tasks.
Give your bot new abilities like add new entries, update existing records, and retrieve essential information.
Stay agile and organized by dynamically adding new sheets to accommodate evolving data needs, ensuring your spreadsheets remain flexible and scalable.

## Configuration

### Automatic configuration with OAuth

To set up the Google Sheets integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Google Sheets.

When using this configuration mode, a Botpress-managed Google Sheets application will be used to connect to your Google account. However, actions taken by the bot will be attributed to the user who authorized the connection, rather than the application. For this reason, **we do not recommend using personal Google accounts** for this integration. You should set up a service account and use this account to authorize the connection.

Once the connection is established, you must specify the identifier of the Google Spreadsheet you want to interact with. This identifier is the long string of characters in the URL between `/spreadsheets/d/` and `/edit` when you are editing a spreadsheet.

> For example, if the URL is `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`, the identifier of the spreadsheet is `1a2b3c4d5e6f7g8h9i0j`.

1. Find your Google Spreadsheet ID for the spreadsheet you want to interact with.
2. Authorize the Google Sheets integration by clicking the authorization button.
3. Fill in the **Spreadsheet ID** field and save the configuration.

### Manual configuration using a service account

1. Login to Google Cloud Console and create a new project.
2. Enable Google Sheets API for the project.
3. Create a service account for the project. This integration won't work with any other type of credentials.
4. Download the JSON credentials file and save it somewhere safe.
5. The downloaded JSON file contains a `client_email` field. Share your spreadsheet with this email address to give it access.
6. Install this integration in your bot with the following configuration:
   - **Spreadsheet ID**: The ID of the Google Spreadsheet to interact with. When editing a spreadsheet, the ID is the long string of characters in the URL between `/spreadsheets/d/` and `/edit`.
     - For example, if the URL is `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`, the ID is `1a2b3c4d5e6f7g8h9i0j`.
   - **Service account private key**: The private key from the Google service account. You can get it from the downloaded JSON file.
   - **Service account email**: The client email from the Google service account. You can get it from the downloaded JSON file.

## Managing several sheets

While this integration allows you to interact with a single Google Spreadsheet, you can manage multiple sheets within that spreadsheet. To interact with a specific sheet, you must specify the sheet name as part of the range when performing operations.

The range field uses the same notation as Google Sheets. For example, to interact with a sheet named `Sheet1`, you would use the range `Sheet1!A1:B2`.

## Limitations

Standard Google Sheets API limitations apply to the Google Sheets integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by the Google Cloud platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Google Sheets API documentation](https://developers.google.com/sheets/api/limits).
