import { createPage } from './implementations/create-page'
import { deletePage } from './implementations/delete-page'
import { getFooterComments } from './implementations/get-footer-comments'
import { getPage } from './implementations/get-page'
import { filesReadonlyListItemsInFolder } from './implementations/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './implementations/transfer-file-to-botpress'
import { updatePage } from './implementations/update-page'
import { writeComment } from './implementations/write-comment'
import * as bp from '.botpress'

export const actions = {
  getPage,
  writeComment,
  getFooterComments,
  createPage,
  deletePage,
  updatePage,
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
} as const satisfies bp.IntegrationProps['actions']
