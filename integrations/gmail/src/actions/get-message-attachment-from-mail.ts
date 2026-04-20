import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getMessageAttachmentFromMail = wrapAction(
  { actionName: 'getMessageAttachmentFromMail', errorMessageWhenFailed: 'Failed to get message attachment from mail' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { messageId }: { messageId: string }
  ) => {
    const attachment = await googleClient.messages.getFirstAttachment(messageId)

    return {
      attachment: {
        size: attachment.size ?? null,
        data: attachment.data ?? null,
        attachmentId: attachment.attachmentId ?? null,
      },
    }
  }
)
