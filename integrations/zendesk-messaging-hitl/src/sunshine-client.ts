const SunshineConversationsClientModule = require('sunshine-conversations-client')

export const SunshineConversationsClient = SunshineConversationsClientModule as {
  ApiClient: typeof SunshineConversationsClientModule.ApiClient
  UsersApi: typeof SunshineConversationsClientModule.UsersApi
  ConversationsApi: typeof SunshineConversationsClientModule.ConversationsApi
  MessagesApi: typeof SunshineConversationsClientModule.MessagesApi
  WebhooksApi: typeof SunshineConversationsClientModule.WebhooksApi
  IntegrationsApi: typeof SunshineConversationsClientModule.IntegrationsApi
  SwitchboardsApi: typeof SunshineConversationsClientModule.SwitchboardsApi
  SwitchboardActionsApi: typeof SunshineConversationsClientModule.SwitchboardActionsApi
  SwitchboardIntegrationsApi: typeof SunshineConversationsClientModule.SwitchboardIntegrationsApi
}

export type SuncoConfiguration = {
  appId: string
  keyId: string
  keySecret: string
}

export type SuncoUser = {
  id: string
  profile?: {
    givenName?: string
    surname?: string
    email?: string
    avatarUrl?: string
  }
}

export type SuncoConversation = {
  id: string
}

export type SuncoClientApis = {
  users: InstanceType<typeof SunshineConversationsClient.UsersApi>
  conversations: InstanceType<typeof SunshineConversationsClient.ConversationsApi>
  messages: InstanceType<typeof SunshineConversationsClient.MessagesApi>
  webhooks: InstanceType<typeof SunshineConversationsClient.WebhooksApi>
  integrations: InstanceType<typeof SunshineConversationsClient.IntegrationsApi>
  switchboard: InstanceType<typeof SunshineConversationsClient.SwitchboardsApi>
  switchboardActions: InstanceType<typeof SunshineConversationsClient.SwitchboardActionsApi>
  switchboardIntegrations: InstanceType<typeof SunshineConversationsClient.SwitchboardIntegrationsApi>
}
