/* eslint-disable no-console */
import { MessagingChannel } from '@botpress/messaging-client'
import { getAdminKey, getMessagingURL } from './messaging_helpers'

const messagingUrl = getMessagingURL()
const adminKey = getAdminKey()

async function main() {
  const channel = new MessagingChannel({ url: messagingUrl, adminKey })
  const client = await channel.createClient()
  console.log(client)
}

void main()
