import { changeMessageLabels } from './change-message-labels'
import { createDraft } from './create-draft'
import { createLabel } from './create-label'
import { deleteDraft } from './delete-draft'
import { deleteLabel } from './delete-label'
import { deleteMessage } from './delete-message'
import { forwardMessage } from './forward-message'
import { getDraft } from './get-draft'
import { getLabel } from './get-label'
import { getMessage } from './get-message'
import { getMessageAttachment } from './get-message-attachment'
import { getMessageAttachmentFromMail } from './get-message-attachment-from-mail'
import { getThread } from './get-thread'
import { listDrafts } from './list-drafts'
import { listLabels } from './list-labels'
import { listMessages } from './list-messages'
import { listThreads } from './list-threads'
import { sendDraft } from './send-draft'
import { sendMail } from './send-mail'
import { trashMessage } from './trash-message'
import { trashThread } from './trash-thread'
import { untrashMessage } from './untrash-message'
import { untrashThread } from './untrash-thread'
import { updateDraft } from './update-draft'
import { updateLabel } from './update-label'
import * as bp from '.botpress'

export const actions = {
  // Message actions
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
  // Thread actions
  listThreads,
  getThread,
  trashThread,
  untrashThread,
  // Label actions
  listLabels,
  getLabel,
  createLabel,
  deleteLabel,
  updateLabel,
  // Draft actions
  listDrafts,
  getDraft,
  createDraft,
  deleteDraft,
  updateDraft,
  sendDraft,
} as const satisfies bp.IntegrationProps['actions']
