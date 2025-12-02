import { changeMessageLabels } from './change-message-labels'
import { deleteMessage } from './delete-message'
import { forwardMessage } from './forward-message'
import { getMessageAttachment } from './get-message-attachment'
import { getMessageAttachmentFromMail } from './get-message-attachment-from-mail'
import { trashMessage } from './trash-message'
import { untrashMessage } from './untrash-message'
import * as bp from '.botpress'

export const actions = {
  deleteMessage,
  trashMessage,
  untrashMessage,
  changeMessageLabels,
  getMessageAttachment,
  getMessageAttachmentFromMail,
  forwardMessage,
} as const satisfies bp.IntegrationProps['actions']
