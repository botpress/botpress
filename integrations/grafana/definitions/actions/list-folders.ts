import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listFolders = {
  title: 'List Folders',
  description: 'List all Grafana folders',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      folders: z
        .array(
          z.object({
            uid: z.string().optional().title('UID').describe('Folder UID'),
            title: z.string().optional().title('Title').describe('Folder display name'),
            parentUid: z.string().optional().title('Parent UID').describe('UID of the parent folder, if nested'),
          })
        )
        .title('Folders')
        .describe('List of all folders'),
    }),
  },
} satisfies ActionDef
