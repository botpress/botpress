import { addToSync } from './actions'
import { filesReadonlyListItemsInFolder, filesReadonlyTransferFileToBotpress } from './files-readonly/actions'
import { register, unregister, handler } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  handler,
  actions: {
    addToSync,
    filesReadonlyListItemsInFolder,
    filesReadonlyTransferFileToBotpress,
  },
  channels: {},
})
