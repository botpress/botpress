import { z, ActionDefinition } from '@botpress/sdk'

export const addToSync: ActionDefinition = {
  title: 'Add To Sync',
  description: 'Add new data to the sync list',
  input: {
    schema: z.object({
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
    }),
  },
  output: { schema: z.object({ success: z.boolean() }) },
}

export const actions = {
  addToSync,
}
