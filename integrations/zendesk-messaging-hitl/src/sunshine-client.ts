const SunshineConversationsClientModule = require('sunshine-conversations-client')

export const SunshineConversationsClient = SunshineConversationsClientModule as {
  ApiClient: typeof SunshineConversationsClientModule.ApiClient
  AppsApi: typeof SunshineConversationsClientModule.AppsApi
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
