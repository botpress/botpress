import * as sdk from '@botpress/sdk'
import { changeMessageLabels } from './actions/change-message-labels'
import { deleteMessage } from './actions/delete-message'
import { getMessageAttachment } from './actions/get-message-attachment'
import { getMessageAttachmentFromMail } from './actions/get-message-attachment-from-mail'
import { trashMessage } from './actions/trash-message'
import { untrashMessage } from './actions/untrash-message'

export const actions = {
  deleteMessage,
  trashMessage,
  untrashMessage,
  changeMessageLabels,
  getMessageAttachment,
  getMessageAttachmentFromMail,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
