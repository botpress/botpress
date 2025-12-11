// @ts-expect-error No types for sunshine-conversations-client
import * as SunshineConversationsClientModule from 'sunshine-conversations-client'

export function createClient(keyId: string, keySecret: string) {
  const apiClient = new SunshineConversationsApi.ApiClient()
  const auth = apiClient.authentications['basicAuth']
  auth.username = keyId
  auth.password = keySecret

  return {
    activities: new SunshineConversationsApi.ActivitiesApi(apiClient),
    apps: new SunshineConversationsApi.AppsApi(apiClient),
    users: new SunshineConversationsApi.UsersApi(apiClient),
    conversations: new SunshineConversationsApi.ConversationsApi(apiClient),
    messages: new SunshineConversationsApi.MessagesApi(apiClient),
    webhooks: new SunshineConversationsApi.WebhooksApi(apiClient),
    integrations: new SunshineConversationsApi.IntegrationsApi(apiClient),
    switchboard: new SunshineConversationsApi.SwitchboardsApi(apiClient),
    switchboardActions: new SunshineConversationsApi.SwitchboardActionsApi(apiClient),
    switchboardIntegrations: new SunshineConversationsApi.SwitchboardIntegrationsApi(apiClient),
  }
}

// The typings below were generated using AI based on dist from sunshine-conversations-client

// ============================================================================
// ApiClient Types
// ============================================================================

export type BasicAuth = {
  type: 'basic'
  username?: string
  password?: string
}

export type BearerAuth = {
  type: 'bearer'
  accessToken?: string
}

export type ApiClientAuthentications = {
  basicAuth: BasicAuth
  bearerAuth: BearerAuth
}

// This is a very simplified type for the ApiClient
export type ApiClient = {
  authentications: ApiClientAuthentications
}

// ============================================================================
// AppsApi Types
// ============================================================================

export type App = {
  id: string
  displayName?: string
  subdomain?: string
  settings?: unknown
  metadata?: unknown
}

export type CreateAppRequest = {
  displayName?: string
  settings?: unknown
  metadata?: unknown
}

export type UpdateAppRequest = {
  displayName?: string
  settings?: unknown
  metadata?: unknown
}

export type AppListFilter = {
  serviceAccountId?: string
}

export type AppsApi = {
  getApp(appId: string): Promise<{ app: App }>
  createApp(appPost: CreateAppRequest): Promise<{ app: App }>
  updateApp(appId: string, appUpdate: UpdateAppRequest): Promise<{ app: App }>
  deleteApp(appId: string): Promise<object>
  listApps(opts?: { page?: Page; filter?: AppListFilter }): Promise<{ apps?: App[] }>
}

// ============================================================================
// UsersApi Types
// ============================================================================

export type UserProfile = {
  givenName?: string
  surname?: string
  email?: string
  avatarUrl?: string
}

export type User = {
  id: string
  externalId?: string
  profile?: UserProfile
}

export type CreateUserRequest = {
  externalId: string
  profile?: UserProfile
}

export type UpdateUserRequest = {
  profile?: UserProfile
}

export type UsersApi = {
  getUser(appId: string, userIdOrExternalId: string): Promise<{ user: User }>
  createUser(appId: string, userPost: CreateUserRequest): Promise<{ user: User }>
  updateUser(appId: string, userIdOrExternalId: string, userUpdate: UpdateUserRequest): Promise<{ user: User }>
  deleteUser(appId: string, userIdOrExternalId: string): Promise<object>
  deleteUserPersonalInformation(appId: string, userIdOrExternalId: string): Promise<{ user: User }>
}

// ============================================================================
// ConversationsApi Types
// ============================================================================

export type Conversation = {
  id: string
  type?: 'personal' | 'sdkGroup'
  displayName?: string
  activeSwitchboardIntegration?: {
    id: string
    name?: string
    integrationId?: string
    integrationType?: string
  }
  pendingSwitchboardIntegration?: {
    id: string
    name?: string
    integrationId?: string
    integrationType?: string
  }
}

export type ConversationParticipant = {
  userId: string
  subscribeSDKClient?: boolean
}

export type CreateConversationRequest = {
  type: 'personal' | 'sdkGroup'
  displayName?: string
  participants: ConversationParticipant[]
  metadata?: Record<string, unknown>
}

export type UpdateConversationRequest = {
  displayName?: string
  metadata?: Record<string, unknown>
}

export type ConversationListFilter = {
  userId?: string
  userExternalId?: string
}

export type Page = {
  after?: string
  before?: string
  size?: number
}

export type ConversationsApi = {
  getConversation(appId: string, conversationId: string): Promise<{ conversation: Conversation }>
  createConversation(
    appId: string,
    conversationPost: CreateConversationRequest
  ): Promise<{ conversation: Conversation }>
  updateConversation(
    appId: string,
    conversationId: string,
    conversationUpdate: UpdateConversationRequest
  ): Promise<{ conversation: Conversation }>
  deleteConversation(appId: string, conversationId: string): Promise<object>
  listConversations(
    appId: string,
    filter: ConversationListFilter,
    opts?: { page?: Page }
  ): Promise<{ conversations?: Conversation[] }>
}

// ============================================================================
// MessagesApi Types
// ============================================================================

export type MessageAuthor = {
  type?: 'user' | 'business'
  userId?: string
  displayName?: string
  avatarUrl?: string
  subtypes?: string[]
}

export type TextMessageContent = {
  type: 'text'
  text: string
}

export type ImageMessageContent = {
  type: 'image'
  mediaUrl: string
  mediaType?: string
  altText?: string
}

export type FileMessageContent = {
  type: 'file'
  mediaUrl: string
  mediaType?: string
  altText?: string
}

export type LocationMessageContent = {
  type: 'location'
  coordinates: {
    lat: number
    long: number
  }
}

export type CarouselMessageContent = {
  type: 'carousel'
  items: unknown[]
}

export type ListMessageContent = {
  type: 'list'
  items: unknown[]
}

export type MessageContent =
  | TextMessageContent
  | ImageMessageContent
  | FileMessageContent
  | LocationMessageContent
  | CarouselMessageContent
  | ListMessageContent

export type Message = {
  id: string
  type?: string
  author?: MessageAuthor
  content?: MessageContent
  received?: string
  source?: {
    type?: string
    originalMessageTimestamp?: string
  }
  metadata?: Record<string, unknown>
}

export type PostMessageRequest = {
  author: MessageAuthor
  content: MessageContent
  metadata?: Record<string, unknown>
}

export type MessagesApi = {
  postMessage(appId: string, conversationId: string, messagePost: PostMessageRequest): Promise<{ messages?: Message[] }>
  listMessages(appId: string, conversationId: string, opts?: { page?: Page }): Promise<{ messages?: Message[] }>
  deleteMessage(appId: string, conversationId: string, messageId: string): Promise<object>
  deleteAllMessages(appId: string, conversationId: string): Promise<object>
}

// ============================================================================
// IntegrationsApi Types
// ============================================================================

export type Integration = {
  id: string
  type?: string
  status?: 'active' | 'inactive'
  displayName?: string
  webhooks?: Webhook[]
}

export type CreateIntegrationRequest = {
  type: 'custom' | string
  status?: 'active' | 'inactive'
  displayName: string
  webhooks?: CreateWebhookRequest[]
}

export type UpdateIntegrationRequest = {
  status?: 'active' | 'inactive'
  displayName?: string
}

export type IntegrationListFilter = {
  types?: string
}

export type IntegrationsApi = {
  getIntegration(appId: string, integrationId: string): Promise<{ integration: Integration }>
  createIntegration(appId: string, integrationPost: CreateIntegrationRequest): Promise<{ integration: Integration }>
  updateIntegration(
    appId: string,
    integrationId: string,
    integrationUpdate: UpdateIntegrationRequest
  ): Promise<{ integration: Integration }>
  deleteIntegration(appId: string, integrationId: string): Promise<object>
  listIntegrations(
    appId: string,
    opts?: { page?: Page; filter?: IntegrationListFilter }
  ): Promise<{ integrations?: Integration[] }>
}

// ============================================================================
// WebhooksApi Types
// ============================================================================

export type Webhook = {
  id: string
  target: string
  triggers?: string[]
  includeFullUser?: boolean
  includeFullSource?: boolean
}

export type CreateWebhookRequest = {
  target: string
  triggers: string[]
  includeFullUser?: boolean
  includeFullSource?: boolean
}

export type UpdateWebhookRequest = {
  target?: string
  triggers?: string[]
  includeFullUser?: boolean
  includeFullSource?: boolean
}

export type WebhooksApi = {
  getWebhook(appId: string, integrationId: string, webhookId: string): Promise<{ webhook: Webhook }>
  createWebhook(appId: string, integrationId: string, webhookPost: CreateWebhookRequest): Promise<{ webhook: Webhook }>
  updateWebhook(
    appId: string,
    integrationId: string,
    webhookId: string,
    webhookUpdate: UpdateWebhookRequest
  ): Promise<{ webhook: Webhook }>
  deleteWebhook(appId: string, integrationId: string, webhookId: string): Promise<object>
  listWebhooks(appId: string, integrationId: string): Promise<{ webhooks?: Webhook[] }>
}

// ============================================================================
// SwitchboardsApi Types
// ============================================================================

export type Switchboard = {
  id: string
  enabled?: boolean
  defaultSwitchboardIntegrationId?: string
}

export type SwitchboardUpdateBody = {
  enabled?: boolean
  defaultSwitchboardIntegrationId?: string
}

export type SwitchboardsApi = {
  createSwitchboard(appId: string): Promise<{ switchboard: Switchboard }>
  updateSwitchboard(
    appId: string,
    switchboardId: string,
    switchboardUpdate: SwitchboardUpdateBody
  ): Promise<{ switchboard: Switchboard }>
  deleteSwitchboard(appId: string, switchboardId: string): Promise<object>
  listSwitchboards(appId: string): Promise<{ switchboards?: Switchboard[] }>
}

// ============================================================================
// SwitchboardIntegrationsApi Types
// ============================================================================

export type SwitchboardIntegration = {
  id: string
  name?: string
  integrationId?: string
  integrationType?: string
  deliverStandbyEvents?: boolean
}

export type CreateSwitchboardIntegrationRequest = {
  name: string
  integrationId: string
  deliverStandbyEvents?: boolean
}

export type UpdateSwitchboardIntegrationRequest = {
  name?: string
  deliverStandbyEvents?: boolean
}

export type SwitchboardIntegrationsApi = {
  createSwitchboardIntegration(
    appId: string,
    switchboardId: string,
    switchboardIntegrationPost: CreateSwitchboardIntegrationRequest
  ): Promise<{ switchboardIntegration: SwitchboardIntegration }>
  updateSwitchboardIntegration(
    appId: string,
    switchboardId: string,
    switchboardIntegrationId: string,
    switchboardIntegrationUpdate: UpdateSwitchboardIntegrationRequest
  ): Promise<{ switchboardIntegration: SwitchboardIntegration }>
  deleteSwitchboardIntegration(appId: string, switchboardId: string, switchboardIntegrationId: string): Promise<object>
  listSwitchboardIntegrations(
    appId: string,
    switchboardId: string
  ): Promise<{ switchboardIntegrations?: SwitchboardIntegration[] }>
}

// ============================================================================
// SwitchboardActionsApi Types
// ============================================================================

export type PassControlBody = {
  switchboardIntegration: string
  metadata?: Record<string, string>
}

export type OfferControlBody = {
  switchboardIntegration: string
  metadata?: Record<string, string>
}

export type AcceptControlBody = {
  metadata?: Record<string, string>
}

export type SwitchboardActionsApi = {
  passControl(appId: string, conversationId: string, passControlBody: PassControlBody): Promise<object>
  offerControl(appId: string, conversationId: string, offerControlBody: OfferControlBody): Promise<object>
  acceptControl(appId: string, conversationId: string, acceptControlBody: AcceptControlBody): Promise<object>
  releaseControl(appId: string, conversationId: string): Promise<object>
}

// ============================================================================
// ClientsApi Types
// ============================================================================

export type Client = {
  id: string
  type?: string
  status?: 'active' | 'pending' | 'inactive' | 'blocked'
  integrationId?: string
  displayName?: string
  avatarUrl?: string
  info?: Record<string, unknown>
  raw?: Record<string, unknown>
  lastSeen?: string
  linkedAt?: string
  externalId?: string
}

export type ClientMatchCriteria = {
  type: string
  integrationId?: string
  externalId?: string
  [key: string]: unknown
}

export type ClientCreateBody = {
  matchCriteria: ClientMatchCriteria
  confirmation?: {
    type: 'immediate' | 'userActivity' | 'prompt'
    message?: { author: MessageAuthor; content: MessageContent }
  }
  target?: {
    conversationId?: string
  }
}

export type ClientsApi = {
  createClient(appId: string, userIdOrExternalId: string, clientCreate: ClientCreateBody): Promise<{ client: Client }>
  removeClient(appId: string, userIdOrExternalId: string, clientId: string): Promise<object>
  listClients(appId: string, userIdOrExternalId: string, opts?: { page?: Page }): Promise<{ clients?: Client[] }>
}

// ============================================================================
// ParticipantsApi Types
// ============================================================================

export type Participant = {
  id: string
  oderId?: string
  userExternalId?: string
  unreadCount?: number
  lastRead?: string
}

export type ParticipantJoinBody = {
  userId?: string
  userExternalId?: string
  subscribeSDKClient?: boolean
}

export type ParticipantLeaveBody = {
  participantId?: string
  userId?: string
  userExternalId?: string
}

export type ParticipantsApi = {
  joinConversation(
    appId: string,
    conversationId: string,
    participantJoinBody: ParticipantJoinBody
  ): Promise<{ participant: Participant }>
  leaveConversation(appId: string, conversationId: string, participantLeaveBody: ParticipantLeaveBody): Promise<object>
  listParticipants(
    appId: string,
    conversationId: string,
    opts?: { page?: Page }
  ): Promise<{ participants?: Participant[] }>
}

// ============================================================================
// AttachmentsApi Types
// ============================================================================

export type AttachmentSchema = {
  mediaUrl?: string
  mediaType?: string
  mediaSize?: number
}

export type AttachmentDeleteBody = {
  mediaUrl: string
}

export type AttachmentMediaTokenBody = {
  attachmentPaths: string[]
}

export type AttachmentMediaTokenResponse = {
  mediaToken?: string
}

export type AttachmentsApi = {
  uploadAttachment(
    appId: string,
    access: 'public' | 'private',
    source: File | Blob,
    opts?: { _for?: string; conversationId?: string }
  ): Promise<{ attachment: AttachmentSchema }>
  deleteAttachment(appId: string, attachmentDeleteBody: AttachmentDeleteBody): Promise<object>
  generateMediaJsonWebToken(
    appId: string,
    attachmentMediaTokenBody: AttachmentMediaTokenBody
  ): Promise<AttachmentMediaTokenResponse>
  setCookie(appId: string): Promise<object>
}

// ============================================================================
// ActivitiesApi Types
// ============================================================================

export type ActivityPostType = 'conversation:read' | 'typing:start' | 'typing:stop'

export type ActivityPost = {
  author: {
    type: 'user' | 'business'
    userId?: string
  }
  type: ActivityPostType
}

export type ActivitiesApi = {
  postActivity(appId: string, conversationId: string, activityPost: ActivityPost): Promise<object>
}

// ============================================================================
// AppKeysApi Types
// ============================================================================

export type AppKey = {
  id: string
  key?: string
  secret?: string
}

export type AppKeysApi = {
  createAppKey(appId: string, appKeyPost: { displayName?: string }): Promise<{ key: AppKey }>
  deleteAppKey(appId: string, keyId: string): Promise<void>
  listAppKeys(appId: string): Promise<{ keys?: AppKey[] }>
}

// ============================================================================
// CustomIntegrationApiKeysApi Types
// ============================================================================

export type CustomIntegrationApiKey = {
  id: string
  key?: string
  secret?: string
}

export type CustomIntegrationApiKeysApi = {
  createCustomIntegrationApiKey(
    appId: string,
    integrationId: string,
    customIntegrationApiKeyPost: { displayName?: string }
  ): Promise<{ key: CustomIntegrationApiKey }>
  deleteCustomIntegrationApiKey(appId: string, integrationId: string, keyId: string): Promise<void>
  listCustomIntegrationApiKeys(appId: string, integrationId: string): Promise<{ keys?: CustomIntegrationApiKey[] }>
}

// ============================================================================
// OAuthEndpointsApi Types
// ============================================================================

export type OAuthEndpoint = {
  id: string
  uri?: string
}

export type OAuthEndpointsApi = {
  createOAuthEndpoint(
    appId: string,
    integrationId: string,
    oAuthEndpointPost: { uri: string }
  ): Promise<{ oauthEndpoint: OAuthEndpoint }>
  deleteOAuthEndpoint(appId: string, integrationId: string, oauthEndpointId: string): Promise<void>
  listOAuthEndpoints(appId: string, integrationId: string): Promise<{ oauthEndpoints?: OAuthEndpoint[] }>
}

// ============================================================================
// SunshineConversationsApi Export
// ============================================================================

// Helper type to create a constructor that returns an instance implementing the interface
type TypedApiConstructor<T> = new (apiClient: ApiClient) => T

export const SunshineConversationsApi = SunshineConversationsClientModule as {
  ApiClient: new () => ApiClient
  ActivitiesApi: TypedApiConstructor<ActivitiesApi>
  AppKeysApi: TypedApiConstructor<AppKeysApi>
  AppsApi: TypedApiConstructor<AppsApi>
  AttachmentsApi: TypedApiConstructor<AttachmentsApi>
  ClientsApi: TypedApiConstructor<ClientsApi>
  ConversationsApi: TypedApiConstructor<ConversationsApi>
  CustomIntegrationApiKeysApi: TypedApiConstructor<CustomIntegrationApiKeysApi>
  IntegrationsApi: TypedApiConstructor<IntegrationsApi>
  MessagesApi: TypedApiConstructor<MessagesApi>
  OAuthEndpointsApi: TypedApiConstructor<OAuthEndpointsApi>
  ParticipantsApi: TypedApiConstructor<ParticipantsApi>
  SwitchboardActionsApi: TypedApiConstructor<SwitchboardActionsApi>
  SwitchboardIntegrationsApi: TypedApiConstructor<SwitchboardIntegrationsApi>
  SwitchboardsApi: TypedApiConstructor<SwitchboardsApi>
  UsersApi: TypedApiConstructor<UsersApi>
  WebhooksApi: TypedApiConstructor<WebhooksApi>
}
