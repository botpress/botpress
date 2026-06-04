import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    clientId: z.string().min(1).title('Client ID').describe('Azure AD application client ID'),
    tenantId: z.string().min(1).title('Tenant ID').describe('Azure AD tenant ID'),
    thumbprint: z.string().min(1).title('Certificate Thumbprint').describe('Certificate thumbprint'),
    privateKey: z.string().min(1).title('Private Key').describe('PEM-formatted certificate private key'),
    primaryDomain: z
      .string()
      .min(1)
      .title('Primary Domain')
      .describe('SharePoint primary domain (e.g. contoso, without .sharepoint.com)'),
    siteName: z.string().min(1).title('Site Name').describe('SharePoint site name'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {} satisfies IntegrationDefinitionProps['states']

export const actions = {
  syncExcelFile: {
    title: 'Sync Excel File',
    description: 'Download an Excel file from SharePoint and sync its sheets to Botpress tables',
    input: {
      schema: z.object({
        sharepointFileUrl: z
          .string()
          .min(1)
          .title('SharePoint File URL')
          .describe('Relative path to the Excel file, e.g. /{DocumentLibrary}/{path}/Book.xlsx'),
        sheetTableMapping: z
          .string()
          .min(1)
          .title('Sheet to Table Mapping')
          .describe(
            'Map sheets to tables. Format: \'Sheet1:CustomersTable,Sheet2:OrdersTable\' or JSON: \'{"Sheet1":"CustomersTable"}\'. Table names must end with "Table", be 30 chars or fewer, use only letters/numbers/underscores, and not start with a number.'
          ),
      }),
    },
    output: {
      schema: z.object({
        processedSheets: z
          .array(
            z.object({
              sheetName: z.string().describe('Name of the Excel sheet that was processed'),
              tableName: z.string().describe('Name of the Botpress table the sheet was synced to'),
              rowCount: z.number().describe('Number of rows inserted into the table'),
            })
          )
          .title('Processed Sheets')
          .describe('Summary of each sheet that was synced'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
