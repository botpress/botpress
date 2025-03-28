import * as sdk from '@botpress/sdk'

import { Deleted } from './deleted'
import { File } from './file'
import { Folder } from './folder'

export { File, Folder, Deleted }

export const entities = {
  file: {
    title: 'File',
    description: "A file in a user's Dropbox",
    schema: File.schema,
  },
  folder: {
    title: 'Folder',
    description: "A folder in a user's Dropbox",
    schema: Folder.schema,
  },
} as const satisfies sdk.IntegrationDefinitionProps['entities']
