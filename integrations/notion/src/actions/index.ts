import { addCommentToDiscussion } from './add-comment-to-discussion'
import { addCommentToPage } from './add-comment-to-page'
import { addPageToDb } from './add-page-to-db'
import { deleteBlock } from './delete-block'
import { getDb } from './get-db'
import * as bp from '.botpress'

export const actions = {
  addCommentToDiscussion,
  addCommentToPage,
  addPageToDb,
  deleteBlock,
  getDb,
} as const satisfies bp.IntegrationProps['actions']
