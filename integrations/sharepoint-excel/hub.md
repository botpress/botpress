# SharePoint Excel Integration

## Overview

This integration allows you to sync one or many Excel sheets from a SharePoint document library into one or more Botpress tables. You can map each sheet to a specific table, and the integration will automatically create or update tables as needed. Knowledge Base (KB) links are always preserved—tables are never deleted, only cleared and repopulated.

## Configuration

To set up the connector, you need an App registration with the correct API permissions in Microsoft Entra admin center and the following details:

- **Client ID**: Application (client) ID of your App registration.
- **Tenant ID**: Directory (tenant) ID of your App registration.
- **Thumbprint**: Thumbprint of the certificate you uploaded to your App registration.
- **Private key**: Content of your private key used to sign the certificate. **Important**: Only include the content between "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----", excluding these header and footer lines. The content should be one continuous string with spaces between each line of the key.
- **Primary Domain**: The SharePoint primary domain (e.g. `contoso`).
- **Site Name**: The name of the SharePoint site.

## Action: Sync Excel File

### Inputs

- **sharepointFileUrl**: Relative path to the Excel file in SharePoint. The path should be in the format `/{DOCUMENT_LIBRARY}/{file_path}` where:
  - `DOCUMENT_LIBRARY` is the name of your SharePoint document library (e.g., "Documents", "Shared Documents", or any custom library name)
  - `file_path` is the path to your Excel file within that library, including any subfolders
  - Examples:
    - `/Documents/Book.xlsx` - File in the root of the Documents library
    - `/Shared Documents/Reports/2024/Book.xlsx` - File in a nested folder structure
    - `/MyCustomLibrary/Data/Book.xlsx` - File in a custom document library
- **sheetTableMapping**: Map sheets to tables. Format can be either:

  - Comma-separated: `Sheet1:CustomersTable,Sheet2:OrdersTable`
  - JSON: `{ "Sheet1": "CustomersTable", "Sheet2": "OrdersTable" }`

  Each sheet listed will be synced to the specified table. If a table does not exist, it will be created with a schema matching the sheet's columns. If it exists, all rows will be cleared before new data is inserted. **Note:** If providing a pre-existing table, ensure its column names match the Excel sheet headers exactly, as the integration will not alter an existing table's schema.

  **Table naming:** Botpress requires each table name to **end with `Table`**, be **30 characters or fewer**, contain only letters, numbers, and underscores, and **not start with a number** (e.g. `CustomersTable`, `target_products_Table`).

### Example

```json
{
  "sharepointFileUrl": "/Documents/Book.xlsx",
  "sheetTableMapping": "Sheet1:CustomersTable,Sheet2:OrdersTable"
}
```

## How to's

### How to register an app on Microsoft Entra admin center

- From the Home page of Microsoft Entra admin center, open App registrations (under Applications in the left nav).
- Add a new registration by clicking on "+ New registration".
- Give your app an appropriate name, and click register.
- Open the App registration and take note of the following:
  - `Application (client) ID`
  - `Directory (tenant) ID`

### How to create a certificate for your app registration

- We will be using a self-signed certificate to authenticate. To create a self-signed certificate, run the following commands:
  - `openssl genrsa -out myPrivateKey.key 2048`
  - `openssl req -new -key myPrivateKey.key -out myCertificate.csr`
  - `openssl x509 -req -days 365 -in myCertificate.csr -signkey myPrivateKey.key -out myCertificate.crt`

### How to add your certificate to your app registration

- Navigate to the Azure portal and go to your Azure AD app registration.
- Under "Certificates & secrets," choose "Certificates" and click "Upload certificate."
- Upload your `.crt` file.

### How to update API permissions for your app registration

- Go to "API Permissions" (under the Manage group in your App Registration).
- Click "Add a permission".
- Click on "Microsoft Graph".
- Select "Application permissions" as the type of permission.
- Check `Sites.FullControl.All`, `Sites.Manage.All`, `Sites.Read.All`, `Sites.ReadWrite.All`, `Sites.Selected.All`, `Files.Read.All`, and `Files.ReadWrite.All`.
- Click "Add a permission" again.
- Scroll until you find SharePoint and click on it.
- Select "Application permissions" as the type of permission.
- Check `Sites.FullControl.All`, `Sites.Manage.All`, `Sites.Read.All`, `Sites.ReadWrite.All`, and `Sites.Selected.All`.
- Click "Add permissions."
- You should see all the permissions you added in the permissions list.
- Click on "Grant admin consent for <your_org_name>".

## Notes

- The integration always preserves tables to maintain KB links. Tables are never deleted, only cleared and repopulated.
- If a sheet or table mapping is invalid, the action will fail with a descriptive error.
- Data types for columns are auto-detected (string or number) based on the sheet data.
- If you choose to pre-create a table in Botpress, ensure its column names exactly match the corresponding Excel sheet's header row. The integration will clear existing data but will not alter the schema of an existing table. For successful data import, the column names must align.
