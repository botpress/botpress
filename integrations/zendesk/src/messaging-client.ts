const SunshineConversationsClient = require('sunshine-conversations-client')
import * as bp from '.botpress'

export function createMessagingClient(keyId: string, keySecret: string) {
  const client = new SunshineConversationsClient.ApiClient()
  const auth = client.authentications['basicAuth']
  auth.username = keyId
  auth.password = keySecret

  return {
    messages: new SunshineConversationsClient.MessagesApi(client),
    activity: new SunshineConversationsClient.ActivitiesApi(client),
    apps: new SunshineConversationsClient.AppsApi(client),
    conversations: new SunshineConversationsClient.ConversationsApi(client),
    users: new SunshineConversationsClient.UsersApi(client),
  }
}

export type MessagingClient = ReturnType<typeof createMessagingClient>

export function getMessagingClient(config: bp.configuration.Configuration): MessagingClient | null {
  if (!config.messagingKeyId || !config.messagingKeySecret) {
    return null
  }
  return createMessagingClient(config.messagingKeyId, config.messagingKeySecret)
}

