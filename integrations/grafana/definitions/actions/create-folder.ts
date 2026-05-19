import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createFolderSchema = z.object({
  title: z.string().min(1, 'Title is required').title('Title').describe('Folder display name'),
  uid: z.string().optional().title('UID').describe('Optional custom UID for the folder'),
  parentUid: z.string().optional().title('Parent UID').describe('UID of the parent folder to nest this folder under'),
  description: z.string().optional().title('Description').describe('Folder description'),
})

export const createFolder = {
  title: 'Create Folder',
  description: 'Create a new Grafana folder',
  input: {
    schema: createFolderSchema,
  },
  output: {
    schema: z.object({
      uid: z.string().title('UID').describe('UID of the created folder'),
    }),
  },
} satisfies ActionDef
