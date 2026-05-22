import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteFolder = {
  title: 'Delete Folder',
  description: 'Delete a Grafana folder by UID. Also deletes all dashboards inside it.',
  input: {
    schema: z.object({
      folderUid: z
        .string()
        .min(1, 'Folder UID is required')
        .title('Folder UID')
        .describe('UID of the folder to delete'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
