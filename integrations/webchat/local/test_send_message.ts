/* eslint-disable no-console */
import { MessagingChannel } from '@botpress/messaging-client'
import { getAdminKey, getClientId, getClientToken, getMessagingURL } from '../local/messaging_helpers'

const messagingUrl = getMessagingURL()
const adminKey = getAdminKey()
const clientId = getClientId()
const clientToken = getClientToken()

async function main() {
  const channel = new MessagingChannel({ url: messagingUrl, adminKey })
  channel.start(clientId, { clientToken })
  const user = await channel.createUser(clientId)
  const conv = await channel.createConversation(clientId, user.id)
  const message = await channel.createMessage(clientId, conv.id, undefined, { text: 'Hello I am a bot!' })
  console.log(message)
}

void main()
