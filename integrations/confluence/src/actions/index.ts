import { createPage } from './implementations/create-page'
import { deletePage } from './implementations/delete-page'
import { getPage } from './implementations/get-page'
import { filesReadonlyListItemsInFolder } from './implementations/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './implementations/transfer-file-to-botpress'
import { updatePage } from './implementations/update-page'
import * as bp from '.botpress'

export const actions = {
  getPage,
  createPage,
  deletePage,
  updatePage,
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
} as const satisfies bp.IntegrationProps['actions']
