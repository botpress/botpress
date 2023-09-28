# Botpress Google Sheets Integration

This integration allows you to connect your Botpress chatbot with Google Sheets, a popular spreadsheet management platform. Google Sheets allows you to manage and manipulate data in spreadsheets.

## Setup

To set up the integration, you will need to provide your Google Sheets `spreadsheetId`, `privateKey`, and `clientEmail`.

### Prerequisites

Before enabling the Botpress Google Sheets Integration, please ensure that you have the following:

- A Botpress cloud account.
- `spreadsheetId`, `privateKey`, and `clientEmail` generated from Google Sheets.
- Ensure that the service has Google Sheets API permissions.

### Enable Integration

To enable the Google Sheets integration in Botpress, follow these steps:

1. Access your Botpress admin panel.
2. Navigate to the “Integrations” section.
3. Locate the Google Sheets integration and click on “Enable” or “Configure.”
4. Provide the required `spreadsheetId`, `privateKey`, and `clientEmail`.
5. Save the configuration.

## Usage

Once the integration is enabled, you can start using Google Sheets features from your Botpress chatbot. The integration offers several actions for interacting with Google Sheets, such as `getValues`, `updateValues`, `appendValues`, `clearValues`, `batchUpdate`, `getInfoSpreadsheet` and `addSheet`.

- **Get Values**: This action allows you to retrieve values from a specified range in a sheet.
- **Update Values**: This action allows you to update values in a specified range in a sheet.
- **Append Values**: This action allows you to append values to a specified range in a sheet.
- **Clear Values**: This action allows you to clear values from a specified range in a sheet.
- **Batch Update**: This action allows you to perform multiple update operations on a spreadsheet at once.
- **Get Info Spreadsheet**: This action allows you to retrieve properties and metadata of a spreadsheet.
- **Add Sheet**: This action allows you to add new sheet to the spreadsheet.

## Contributing

Contributions are welcome! Please submit issues and pull requests.

Enjoy seamless spreadsheet management and data manipulation integration between Botpress and Google Sheets!"
