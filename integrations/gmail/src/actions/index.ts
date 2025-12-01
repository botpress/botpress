import { changeMessageLabels } from './change-message-labels'
import { composeRawEmail } from './compose-raw-email'
import { deleteMessage } from './delete-message'
import { forwardMessage } from './forward-message'
import { getMessage } from './get-message'
import { getMessageAttachment } from './get-message-attachment'
import { getMessageAttachmentFromMail } from './get-message-attachment-from-mail'
import { listMessages } from './list-messages'
import { sendMail } from './send-mail'
import { trashMessage } from './trash-message'
import { untrashMessage } from './untrash-message'
import * as bp from '.botpress'

export const actions = {
  listMessages,
  getMessage,
  deleteMessage,
  trashMessage,
  untrashMessage,
  changeMessageLabels,
  getMessageAttachment,
  getMessageAttachmentFromMail,
  forwardMessage,
  sendMail,
  composeRawEmail,
} as const satisfies bp.IntegrationProps['actions']
