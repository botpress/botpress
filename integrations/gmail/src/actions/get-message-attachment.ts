import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getMessageAttachment = wrapAction(
  { actionName: 'getMessageAttachment', errorMessageWhenFailed: 'Failed to get message attachment' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { messageId, attachmentId }: { messageId: string; attachmentId: string }
  ) => {
    const attachment = await googleClient.messages.getAttachment(messageId, attachmentId)

    return {
      attachment: {
        size: attachment.size ?? null,
        data: attachment.data ?? null,
        attachmentId: attachment.attachmentId ?? null,
      },
    }
  }
)
