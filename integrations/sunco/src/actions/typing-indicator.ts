import { getStoredCredentials } from 'src/get-stored-credentials'
import { createClient } from '../api/sunshine-api'
import { getSuncoConversationId } from '../util'
import * as bp from '.botpress'

type SendActivityProps = Pick<bp.AnyMessageProps, 'ctx' | 'client'> & {
  conversationId: string
  typingStatus?: 'start' | 'stop'
  markAsRead?: boolean
}

async function sendActivity({ client, ctx, conversationId, typingStatus, markAsRead }: SendActivityProps) {
  const credentials = await getStoredCredentials(client, ctx)
  const { conversation } = await client.getConversation({ id: conversationId })
  const suncoConversationId = getSuncoConversationId(conversation)
  const suncoClient = createClient(credentials)
  if (markAsRead) {
    await suncoClient.activities.postActivity(credentials.appId, suncoConversationId, {
      type: 'conversation:read',
      author: { type: 'business' },
    })
  }
  if (typingStatus) {
    await suncoClient.activities.postActivity(credentials.appId, suncoConversationId, {
      type: `typing:${typingStatus}`,
      author: { type: 'business' },
    })
  }
}

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async ({
  client,
  ctx,
  input,
}) => {
  const { conversationId } = input
  await sendActivity({
    client,
    ctx,
    conversationId,
    typingStatus: 'start',
    markAsRead: true,
  })
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async ({
  client,
  ctx,
  input,
}) => {
  const { conversationId } = input
  await sendActivity({
    client,
    ctx,
    conversationId,
    typingStatus: 'stop',
  })
  return {}
}
