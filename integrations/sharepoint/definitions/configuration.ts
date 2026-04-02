import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    clientId: z.string().min(1).describe('Azure AD application client ID'),
    tenantId: z.string().min(1).describe('Azure AD tenant ID'),
    thumbprint: z.string().min(1).describe('Certificate thumbprint'),
    privateKey: z.string().min(1).describe('PEM-formatted certificate private key'),
    primaryDomain: z.string().min(1).describe('SharePoint primary domain (e.g. contoso)'),
    siteName: z.string().min(1).describe('SharePoint site name'),
    documentLibraryNames: z
      .string()
      .min(1)
      .describe(
        'Document Libraries to sync. Supported formats: Single library (NewDL), Comma-separated (Policies,Procedures), JSON array (["Policies","Procedures"]), or Single item JSON array (["NewDL"])'
      ),
    folderKbMap: z
      .string()
      .min(1)
      .describe(
        'JSON map of kbId to array of folder prefixes for routing files to specific KBs. Example: {"kb-marketing":["Campaigns"],"kb-policies":["HR","Legal"]}'
      ),
    enableVision: z
      .boolean()
      .default(false)
      .describe('Enable vision processing for uploaded files (transcribes and indexes visual content from files)'),
  }),
} satisfies IntegrationDefinitionProps['configuration']
