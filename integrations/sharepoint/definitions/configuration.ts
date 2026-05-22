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
    documentLibraryNames: z
      .string()
      .array()
      .optional()
      .title('Document Library Names')
      .describe(
        'Document libraries to subscribe to for real-time sync. Not needed for knowledge-connector browsing only.'
      ),
  }),
} satisfies IntegrationDefinitionProps['configuration']
