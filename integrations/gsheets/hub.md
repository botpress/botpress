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

## Usage

### Inserting, modifying, and retrieving values from cells

#### Inserting rows at the end of a table

To insert a new row of data at the end of a table, you can use the _Append Values_ action. This action appends a new row of data after all other rows of data.

To use this action, you must specify the range of one of the rows in the table. This could be the header row or any other row of the table. The action will then find the last row of the table and append the new data after it.

For example, if you have a table with the following data in a sheet called `Sheet1`:

|       | **A**  | **B** | **C**  |
| ----- | ------ | ----- | ------ |
| **1** | _Name_ | _Age_ | _City_ |
| **2** | John   | 30    | NY     |
| **3** | Alice  | 25    | LA     |

To append a new row with the data `Mike`, `35`, `SF`, you could use the following configuration:

```json
{
  "range": "Sheet1!A1:C1",
  "majorDimension": "ROWS",
  "values": [["Mike", "35", "SF"]]
}
```

You can insert multiple rows at once by providing multiple rows of data in the `values` field. For example, to append two new rows with the data `Mike`, `35`, `SF` and `Jane`, `28`, `Chicago`, you could use the following configuration:

```json
{
  "range": "Sheet1!A1:C1",
  "majorDimension": "ROWS",
  "values": [
    ["Mike", "35", "SF"],
    ["Jane", "28", "Chicago"]
  ]
}
```

#### Inserting columns at the end of a table

If you have a table in which data is arranged in columns instead of rows, you can still use the _Append Values_ action to append new columns of data at the end of the table.

For example, if you have a table with the following data in a sheet called `Sheet1`:

|       | **A**  | **B** | **C** |
| ----- | ------ | ----- | ----- |
| **1** | _Name_ | John  | Alice |
| **2** | _Age_  | 30    | 25    |
| **3** | _City_ | NY    | LA    |

To append a new column with the data `Mike`, `35`, `SF`, you could use the following configuration:

```json
{
  "range": "Sheet1!A1:A3",
  "majorDimension": "COLUMNS",
  "values": [["Mike", "35", "SF"]]
}
```

The _Major Dimension_ field is the field that determines whether the data is arranged in rows or columns. If you are appending columns, set the _Major Dimension_ field to `COLUMNS`.

#### Obtaining values from a cell range

To retrieve values from a cell range, you can use the _Get Values_ action. This action retrieves the values from the specified range in the Google Spreadsheet.

For example, if you have the following data in a sheet called `Sheet1`:

|       | **A** | **B** | **C** | **D** |
| ----- | ----- | ----- | ----- | ----- |
| **1** | 1     | 2     | 3     | 4     |
| **2** | 5     | 6     | 7     | 8     |
| **3** | 9     | 10    | 11    | 12    |

To retrieve the values from the range `Sheet1!A1:C3`, you could use the following configuration:

```json
{
  "range": "Sheet1!A1:C3",
  "majorDimension": "ROWS"
}
```

The values will be returned in the following format:

```json
{
  "values": [
    ["1", "2", "3"],
    ["5", "6", "7"],
    ["9", "10", "11"]
  ]
}
```

> If your data is arranged as columns instead of rows, you can set the _Major Dimension_ field to `COLUMNS`.

#### Updating values in a cell range

To change values instead of appending new ones, you can use the _Update Values_ action. This action updates the values in the specified range in the Google Spreadsheet.

For example, if you have the following data in a sheet called `Sheet1`:

|       | **A**  | **B** | **C**  | **D**    |
| ----- | ------ | ----- | ------ | -------- |
| **1** | _Name_ | _Age_ | _City_ | _Job_    |
| **2** | John   | 30    | NY     | Engineer |
| **3** | Alice  | 25    | LA     | Designer |

To change Alice's age to `26` and job to `Developer`, you could use the following configuration:

```json
{
  "range": "Sheet1!B3:C3",
  "majorDimension": "ROWS",
  "values": [["26", "LA", "Developer"]]
}
```

If instead you want to change the city of both John and Alice to `SF`, you could use the following configuration:

```json
{
  "range": "Sheet1!C2:C3",
  "majorDimension": "ROWS",
  "values": [["SF"], ["SF"]]
}
```

This is equivalent to:

```json
{
  "range": "Sheet1!C2:C3",
  "majorDimension": "COLUMNS",
  "values": [["SF", "SF"]]
}
```

### Creating and manipulating sheets

#### Creating a new sheet

To create a new sheet in the Google Spreadsheet, you can use the _Add Sheet_ action. This action creates a new sheet with the specified name and places it at the end of the list of sheets.

#### Obtaining the list of all sheets

To retrieve the list of all sheets in the Google Spreadsheet, you can use the _Get All Sheets in Spreadsheet_ action. This action returns the names and id of all sheets in the spreadsheet.

It will return a JSON object with the following structure:

```json
{
  "sheets": [
    {
      "sheetId": 904893745,
      "title": "Time sheet",
      "index": 0,
      "isHidden": false,
      "hasProtectedRanges": false,
      "isFullyProtected": false
    },
    {
      "sheetId": 937004904,
      "title": "Stats",
      "index": 1,
      "isHidden": false,
      "hasProtectedRanges": true,
      "isFullyProtected": false
    }
  ]
}
```

#### Moving a sheet horizontally

If you want a sheet to appear before or after another sheet, you can use the _Move Sheet Horizontally_ action. This action moves the specified sheet to the specified position in the list of sheets.

> To use this action, you must first retrieve the id of the sheet you want to move using the _Get All Sheets in Spreadsheet_ action.

For example, if you want to move the sheet named `Stats` to the first position in the list of sheets, you could use the following configuration:

```json
{
  "sheetId": 937004904,
  "newIndex": 0
}
```

When changing the order of sheets, the new position is based on their current order. For example, if you have three sheets (S1, S2, S3) and you want to move S1 to be after S2, you would set the index to 2. A request to change a sheet's position will be ignored if the new index is the same as the current index or if it is one more than the current index.

### Working with named ranges

When working with large or complex spreadsheets, it can be helpful to define named ranges for specific cell ranges. Named ranges provide a convenient way to reference a specific cell range by a meaningful name.

#### Creating a named range

To create a new named range in the Google Spreadsheet, you can use the _Create Named Range in Sheet_ action. This action creates a new named range with the specified name and range.

> To use this action, you must first retrieve the id of the sheet you want to move using the _Get All Sheets in Spreadsheet_ action.

For example, if you want to create a named range called `MyNamedRange` that refers to the range `Sheet1!A1:B2`, you could use the following configuration:

```json
{
  "sheetId": 937004904, // The id the sheet; not its name
  "name": "MyNamedRange",
  "range": "Sheet1!A1:B2"
}
```

Once the named range is created, you can reference it by name in other actions that require a range.

#### Obtaining the list of all named ranges

To retrieve the list of all named ranges in the Google Spreadsheet, you can use the _Get Named Ranges_ action. This action returns the names, ids, and ranges of all named ranges in the spreadsheet.

For example, if you have two named ranges in the spreadsheet, `MyRange` and `NamedRange1`, the action would return data similar to the following:

```json
{
  "namedRanges": [
    {
      "namedRangeId": "1001473037",
      "name": "MyRange",
      "range": "A1",
      "sheetId": 206659759
    },
    {
      "namedRangeId": "lkk0nrl90uiy",
      "name": "NamedRange1",
      "range": "F28:F32",
      "sheetId": 937004904
    }
  ]
}
```

### Working with protected ranges

Google Sheets allows you to protect specific ranges of cells to prevent them from being edited. Protected ranges can be useful when you want to ensure that certain data remains unchanged.

#### Protecting a named range

To created a protected range from a previously-defined named range, you can use the _Protect Named Range_ action. This action creates a protected range from the specified named range.

> To use this action, you must first retrieve the id of the named range you want to protect using the _Get Named Ranges_ action.

For example, if you have a named range called `MyNamedRange`, you could use the following configuration to protect this range:

```json
{
  "namedRangeId": "1001473037",
  "warningOnly": false,
  "requestingUserCanEdit": true
}
```

In the above example, the `warningOnly` field specifies whether a warning should be displayed when users try to edit the protected range. If this mode is activated, users are still able to edit the range if they dismiss the warning.
The `requestingUserCanEdit` field specifies whether the user who requested the protection can edit the protected range, regardless of the `warningOnly` option.

#### Obtaining the list of all protected ranges

To retrieve the list of all protected ranges in the Google Spreadsheet, you can use the _Get Protected Ranges_ action. This action returns the ids, ranges, and permissions of all protected ranges in the spreadsheet.

```json
{
  "protectedRanges": [
    {
      "protectedRangeId": 1815142986,
      "namedRangeId": "",
      "range": ":",
      "sheetId": 937004904,
      "description": "",
      "warningOnly": true,
      "requestingUserCanEdit": true
    },
    {
      "protectedRangeId": 640323292,
      "namedRangeId": "lkk0nrl90uiy",
      "range": "F28:F32",
      "sheetId": 937004904,
      "description": "",
      "warningOnly": false,
      "requestingUserCanEdit": true
    }
  ]
}
```

In the above example, the first protect range is a warning-only range that covers the entire sheet with id `937004904`, while the second protected range is a range that covers the entirety of the _named range_ with id `lkk0nrl90uiy`.

#### Unprotecting a range

To remove protection from a previously protected range, you can use the _Unprotect Range_ action. This action removes the protection from the specified range.

> To use this action, you must first retrieve the id of the protected range you want to unprotect using the _Get Protected Ranges_ action.

For example, if you have a protected range with the id `1815142986`, you could use the following configuration to unprotect this range:

```json
{
  "protectedRangeId": 1815142986
}
```

### Working with formulas

When inserting or updating values in a cell range, you can include formulas in the data. Google Sheets will automatically interpret the data as a formula and store it in the cell.
Please make sure to include the `=` sign at the beginning of the formula to indicate that it is a formula.

### Querying metadata

To obtain metadata about the spreadsheet or its sheets, you can use the _Get Info of a SpreadSheet_ action. In the _Field name_ field, you can specify the metadata you want to retrieve.

For example, to retrieve the title, locale, and time zone of the spreadsheet, you could use the following configuration:

```json
{
  "fields": ["properties.title", "properties.locale", "properties.timeZone"]
}
```

The action will return an object with the requested metadata:

```json
{
  "properties": {
    "title": "My Spreadsheet",
    "locale": "en_US",
    "timeZone": "America/New_York"
  }
}
```

> Note: Using wildcards to retrieve all metadata fields is supported, but it is not recommended as it can quickly exhaust your API limits. For instance, you could use `*` to fetch all metadata fields or `sheets.properties.*` to fetch all property fields of all sheets.

Here are some examples of metadata fields you can query:

- `properties.title`: The title of the spreadsheet.
- `properties.locale`: The locale of the spreadsheet.
- `properties.timeZone`: The time zone of the spreadsheet.
- `properties.autoRecalc`: The auto-recalculation setting of the spreadsheet.
- `properties.defaultFormat`: The default format of the spreadsheet.
- `sheets.properties.title`: The title of all sheets.
- `sheets.properties.sheetId`: The ID of all sheets.
- `sheets.properties.gridProperties.rowCount`: The number of rows in all sheets.
- `sheets.properties.gridProperties.columnCount`: The number of columns in all sheets.
- `namedRanges.namedRangeId`: The ID of all named ranges.

## Limitations

Standard Google Sheets API limitations apply to the Google Sheets integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by the Google Cloud platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Google Sheets API documentation](https://developers.google.com/sheets/api/limits).
