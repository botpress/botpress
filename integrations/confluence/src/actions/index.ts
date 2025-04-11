import * as bp from '.botpress'

import { getAllPages } from './implementations/get-all-pages'
import { getPage } from './implementations/get-page'
import { filesReadonlyListItemsInFolder } from './implementations/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './implementations/transfer-file-to-botpress'

export const actions = {
  getPage,
  getAllPages,
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
} as const satisfies bp.IntegrationProps['actions']
