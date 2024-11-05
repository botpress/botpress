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

## Key concepts

### Spreadsheet

A spreadsheet is the primary object in Google Sheets. It can contain multiple _sheets_, each with structured information contained in _cells_. Each spreadsheet has a unique identifier called the _Spreadsheet ID_.

### Spreadsheet ID

The Spreadsheet ID is a unique identifier for a Google _spreadsheet_. It is a long string of characters that can be found in the URL when editing a spreadsheet. The ID is located between `/spreadsheets/d/` and `/edit`.

### Sheet

A sheet is a page or tab within a _spreadsheet_ that contains a grid of _cells_. Each sheet has a unique name and can contain data, formulas, and formatting.

### Range, A1 notation

The range specifies the sheet and cell range to interact with in the Google Spreadsheet. The range must be given in _A1 notation_, which uses the following format: `SheetName!A1:B2`. The range includes the sheet name followed by an exclamation mark and the cell range.

While the sheet name is optional, it is recommended to include it to avoid ambiguity when interacting with multiple sheets within the same spreadsheet. If it is omitted, the first visible sheet is used.

#### A1 notation examples

- `Sheet1!A1:B2` refers to all the cells in the first two rows and columns of Sheet1.
- `Sheet1!A:A` refers to all the cells in the first column of Sheet1.
- `Sheet1!1:2` refers to all the cells in the first two rows of Sheet1.
- `Sheet1!A5:A` refers to all the cells of the first column of Sheet 1, from row 5 onward.
- `A1:B2` refers to all the cells in the first two rows and columns of the first visible sheet.
- `Sheet1` refers to all the cells in Sheet1.
- `'Mike's_Data'!A1:D5` refers to all the cells in the first five rows and four columns of a sheet named "Mike's_Data."
- `'My Custom Sheet'!A:A` refers to all the cells in the first column of a sheet named "My Custom Sheet."
- `'My Custom Sheet'` refers to all the cells in "My Custom Sheet".
- `MyNamedRange` refers to all the cells in the named range "MyNamedRange".

> **Please note:** single quotes are required for sheet names with spaces, special characters, or an alphanumeric combination.

### Major dimension

The major dimension specifies whether the data is arranged in rows or columns. The major dimension can be either `ROWS` or `COLUMNS`. When performing operations like updating or retrieving values, you can optionally specify the major dimension. If not specified, it defaults to `ROWS`.

For example, assuming the range `Sheet1!A1:F3` contains the following data:

|       | **A** | **B** | **C** | **D** | **E** | **F** |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **1** | 1     | 2     | 3     | 4     | 5     | 6     |
| **2** | 7     | 8     | 9     | 10    | 11    | 12    |
| **3** | 13    | 14    | 15    | 16    | 17    | 18    |

If the major dimension is set to `ROWS`, the data will be returned as follows:

```json
{
  "values": [
    ["1", "2", "3", "4", "5", "6"],
    ["7", "8", "9", "10", "11", "12"],
    ["13", "14", "15", "16", "17", "18"]
  ]
}
```

If the major dimension is set to `COLUMNS`, the data will be returned as follows:

```json
{
  "values": [
    ["1", "7", "13"],
    ["2", "8", "14"],
    ["3", "9", "15"],
    ["4", "10", "16"],
    ["5", "11", "17"],
    ["6", "12", "18"]
  ]
}
```

### Values

The values array contains the data retrieved from the Google Spreadsheet. The data is returned as an array of arrays, with each inner array representing a _major dimension_ (a row or column) of data.

> **Important**: the values are always returned as strings, regardless of the original data type in the spreadsheet. Likewise, when updating values, you must provide the data as strings. Google Sheets will then automatically convert the data to the appropriate type.

The values array accepts all data types supported by Google Sheets, including text, numbers, dates, and formulas.

For example, if you want to update the range `Sheet1!A3:A6` with the values `1`, `2`, `3`, and the formula `=SUM(A3:A5)`, you would provide the following data:

```json
{
  "range": "Sheet1!A3:A6",
  "majorDimension": "ROWS",
  "values": [["1", "2", "3", "=SUM(Sheet1!A3:A5)"]]
}
```

## Limitations

Standard Google Sheets API limitations apply to the Google Sheets integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by the Google Cloud platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Google Sheets API documentation](https://developers.google.com/sheets/api/limits).
