import * as sdk from '@botpress/sdk'
import { changeMessageLabels } from './actions/change-message-labels'
import { createDraft } from './actions/create-draft'
import { createLabel } from './actions/create-label'
import { deleteDraft } from './actions/delete-draft'
import { deleteLabel } from './actions/delete-label'
import { deleteMessage } from './actions/delete-message'
import { getDraft } from './actions/get-draft'
import { getLabel } from './actions/get-label'
import { getMessageAttachment } from './actions/get-message-attachment'
import { getMessageAttachmentFromMail } from './actions/get-message-attachment-from-mail'
import { getThread } from './actions/get-thread'
import { listDrafts } from './actions/list-drafts'
import { listLabels } from './actions/list-labels'
import { listThreads } from './actions/list-threads'
import { sendDraft } from './actions/send-draft'
import { trashMessage } from './actions/trash-message'
import { trashThread } from './actions/trash-thread'
import { untrashMessage } from './actions/untrash-message'
import { untrashThread } from './actions/untrash-thread'
import { updateDraft } from './actions/update-draft'
import { updateLabel } from './actions/update-label'

export const actions = {
  deleteMessage,
  trashMessage,
  untrashMessage,
  changeMessageLabels,
  getMessageAttachment,
  getMessageAttachmentFromMail,

  listThreads,
  getThread,
  trashThread,
  untrashThread,

  listLabels,
  getLabel,
  createLabel,
  deleteLabel,
  updateLabel,

  listDrafts,
  getDraft,
  createDraft,
  deleteDraft,
  updateDraft,
  sendDraft,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
