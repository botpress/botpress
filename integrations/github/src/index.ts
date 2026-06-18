import { reporting } from '@botpress/sdk-addons'
import actions from './actions'
import channels from './channels'
import { filesReadonlyListItemsInFolder, filesReadonlyTransferFileToBotpress } from './files-readonly/actions'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  handler,
  actions: {
    ...actions,
    filesReadonlyListItemsInFolder,
    filesReadonlyTransferFileToBotpress,
  },
  channels,
})

export default reporting.wrapIntegration(integration)
