import { createActionWrapper } from '@botpress/common'
import { DropboxClient } from './dropbox-api'
import * as bp from '.botpress'

export const wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    dropboxClient: DropboxClient.create,
  },
})
