import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteFolder = {
  title: 'Delete Folder',
  description: 'Delete a Grafana folder by UID. Also deletes all dashboards inside it.',
  input: {
    schema: z.object({
      folderUid: z.string().min(1, 'Folder UID is required'),
      forceDeleteRules: z.boolean().default(false).describe('If true, also deletes any alert rules inside the folder'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
