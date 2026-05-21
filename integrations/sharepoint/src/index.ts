import * as bp from '.botpress'
import { register, unregister, handler } from './setup'
import { addToSync } from './actions'
import { filesReadonlyListItemsInFolder, filesReadonlyTransferFileToBotpress } from './files-readonly/actions'

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
