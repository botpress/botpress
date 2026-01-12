import { addCommentToDiscussion } from './add-comment-to-discussion'
import { addCommentToPage } from './add-comment-to-page'
import { appendBlocksToPage } from './append-blocks-to-page'
import { createPage } from './create-page'
import { deleteBlock } from './delete-block'
import { filesReadonlyListItemsInFolder } from './files-readonly/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './files-readonly/transfer-file-to-botpress'
import { getDb } from './get-db'
import { getPage } from './get-page'
import { getPageContent } from './get-page-content'
import { searchByTitle } from './search-by-title'
import { updatePageProperties } from './update-page-properties'
import * as bp from '.botpress'

export const actions = {
  addCommentToDiscussion,
  addCommentToPage,
  createPage,
  appendBlocksToPage,
  deleteBlock,
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
  getDb,
  getPage,
  getPageContent,
  searchByTitle,
  updatePageProperties,
} as const satisfies bp.IntegrationProps['actions']
