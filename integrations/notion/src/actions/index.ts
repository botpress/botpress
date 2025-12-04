import { addCommentToDiscussion } from './add-comment-to-discussion'
import { addCommentToPage } from './add-comment-to-page'
import { addPageToDb } from './add-page-to-db'
import { appendBlockToPage } from './append-block-to-page'
import { deleteBlock } from './delete-block'
import { filesReadonlyListItemsInFolder } from './files-readonly/list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './files-readonly/transfer-file-to-botpress'
import { getDb } from './get-db'
import * as bp from '.botpress'

export const actions = {
  addCommentToDiscussion,
  addCommentToPage,
  addPageToDb,
  appendBlockToPage,
  deleteBlock,
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
  getDb,
} as const satisfies bp.IntegrationProps['actions']
