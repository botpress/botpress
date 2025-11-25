import { RuntimeError } from '@botpress/client'
const SunshineConversationsClient = require('sunshine-conversations-client')
import * as bp from '.botpress'

export function getMessagingClient(config: bp.configuration.Configuration) {
  if (!config.messagingKeyId || !config.messagingKeySecret || !config.messagingAppId) {
    throw new RuntimeError('Messaging client not configured')
  }
  const client = new SunshineConversationsClient.ApiClient()
  const auth = client.authentications['basicAuth']
  auth.username = config.messagingKeyId
  auth.password = config.messagingKeySecret

  return {
    messages: new SunshineConversationsClient.MessagesApi(client),
    activity: new SunshineConversationsClient.ActivitiesApi(client),
    apps: new SunshineConversationsClient.AppsApi(client),
    conversations: new SunshineConversationsClient.ConversationsApi(client),
    users: new SunshineConversationsClient.UsersApi(client),
  }
}
