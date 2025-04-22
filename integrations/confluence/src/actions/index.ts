import { filesReadonlyListItemsInFolder } from './implementations/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './implementations/transfer-file-to-botpress'
import * as bp from '.botpress'

export const actions = {
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
} as const satisfies bp.IntegrationProps['actions']
