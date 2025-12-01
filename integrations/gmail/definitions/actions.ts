import * as sdk from '@botpress/sdk'
import { changeMessageLabels } from './actions/change-message-labels'
import { composeRawEmail } from './actions/compose-raw-email'
import { deleteMessage } from './actions/delete-message'
import { forwardMessage } from './actions/forward-message'
import { getMessage } from './actions/get-message'
import { getMessageAttachment } from './actions/get-message-attachment'
import { getMessageAttachmentFromMail } from './actions/get-message-attachment-from-mail'
import { listMessages } from './actions/list-message'
import { sendMail } from './actions/send-mail'
import { trashMessage } from './actions/trash-message'
import { untrashMessage } from './actions/untrash-message'

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
} as const satisfies sdk.IntegrationDefinitionProps['actions']
