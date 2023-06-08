/* eslint-disable no-console */
import { MessagingChannel } from '@botpress/messaging-client'
import {
  getAdminKey,
  getClientId,
  getMessagingURL,
  getServerWebhookRoute,
  getServerBaseURLDocker,
  getClientToken,
} from '../local/messaging_helpers'

async function main() {
  const clientId = getClientId()
  const clientToken = getClientToken()
  const messagingURL = getMessagingURL()
  const adminKey = getAdminKey()
  const webhookRoute = getServerWebhookRoute()
  const serverURLDocker = getServerBaseURLDocker()

  const channel = new MessagingChannel({ url: messagingURL, adminKey })
  channel.start(clientId, { clientToken })
  const response = await channel.sync(clientId, { webhooks: [{ url: `${serverURLDocker}${webhookRoute}` }] })
  console.log(JSON.stringify(response, undefined, 2))
}

void main()
