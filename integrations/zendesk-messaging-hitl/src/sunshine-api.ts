const SunshineConversationsClientModule = require('sunshine-conversations-client')

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

export type ApiClient = {
  basePath?: string
  authentications: ApiClientAuthentications
  defaultHeaders?: Record<string, string>
  timeout?: number
  cache?: unknown
  enableCookies?: boolean
  agent?: unknown
  requestAgent?: unknown
  plugins?: unknown[]
  paramToString(param: unknown): string
  buildUrl(path: string, pathParams?: Record<string, unknown>): string
  isJsonMime(mime: string): boolean
  jsonPreferredMime(contentTypes: string[]): string | null
  isFileParam(param: unknown): boolean
  normalizeParams(params: Record<string, unknown>): Record<string, unknown>
  buildCollectionParam(param: unknown[], collectionFormat: string): string[]
  applyAuthToRequest(requestOptions: unknown, authNames: string[]): void
  deserialize(response: unknown, returnType: string, mimetype?: string): unknown
  callApi(
    path: string,
    httpMethod: string,
    pathParams?: Record<string, unknown>,
    queryParams?: Record<string, unknown>,
    headerParams?: Record<string, unknown>,
    formParams?: Record<string, unknown>,
    bodyParam?: unknown,
    authNames?: string[],
    contentTypes?: string[],
    accepts?: string[],
    returnType?: string
  ): Promise<unknown>
  hostSettings?: unknown[]
  getBasePathFromSettings(index: number, variables?: Record<string, unknown>): string
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

export type AppsApi = {
  getApp(appId: string): Promise<{ app: App }>
  createApp(appPost: CreateAppRequest): Promise<{ app: App }>
  updateApp(appId: string, appUpdate: UpdateAppRequest): Promise<{ app: App }>
  deleteApp(appId: string): Promise<void>
  listApps(): Promise<{ apps?: App[] }>
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
  updateUser(appId: string, userId: string, userUpdate: UpdateUserRequest): Promise<{ user: User }>
  deleteUser(appId: string, userId: string): Promise<void>
  listUsers(appId: string, page?: number, limit?: number): Promise<{ users?: User[] }>
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
  deleteConversation(appId: string, conversationId: string): Promise<void>
  listConversations(appId: string, page?: number, limit?: number): Promise<{ conversations?: Conversation[] }>
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
  listMessages(appId: string, conversationId: string, page?: number, limit?: number): Promise<{ messages?: Message[] }>
  deleteMessage(appId: string, conversationId: string, messageId: string): Promise<void>
  deleteAllMessages(appId: string, conversationId: string): Promise<void>
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

export type IntegrationsApi = {
  getIntegration(appId: string, integrationId: string): Promise<{ integration: Integration }>
  createIntegration(appId: string, integrationPost: CreateIntegrationRequest): Promise<{ integration: Integration }>
  updateIntegration(
    appId: string,
    integrationId: string,
    integrationUpdate: UpdateIntegrationRequest
  ): Promise<{ integration: Integration }>
  deleteIntegration(appId: string, integrationId: string): Promise<void>
  listIntegrations(appId: string): Promise<{ integrations?: Integration[] }>
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
  getIntegrationWebhook(appId: string, integrationId: string, webhookId: string): Promise<{ webhook: Webhook }>
  createIntegrationWebhook(
    appId: string,
    integrationId: string,
    webhookPost: CreateWebhookRequest
  ): Promise<{ webhook: Webhook }>
  updateIntegrationWebhook(
    appId: string,
    integrationId: string,
    webhookId: string,
    webhookUpdate: UpdateWebhookRequest
  ): Promise<{ webhook: Webhook }>
  deleteIntegrationWebhook(appId: string, integrationId: string, webhookId: string): Promise<void>
  listIntegrationWebhooks(appId: string, integrationId: string): Promise<{ webhooks?: Webhook[] }>
}

// ============================================================================
// SwitchboardsApi Types
// ============================================================================

export type Switchboard = {
  id: string
  name?: string
  integrationId?: string
}

export type SwitchboardsApi = {
  getSwitchboard(appId: string, switchboardId: string): Promise<{ switchboard: Switchboard }>
  createSwitchboard(appId: string, switchboardPost: { name?: string }): Promise<{ switchboard: Switchboard }>
  updateSwitchboard(
    appId: string,
    switchboardId: string,
    switchboardUpdate: { name?: string }
  ): Promise<{ switchboard: Switchboard }>
  deleteSwitchboard(appId: string, switchboardId: string): Promise<void>
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
  getSwitchboardIntegration(
    appId: string,
    switchboardId: string,
    switchboardIntegrationId: string
  ): Promise<{ switchboardIntegration: SwitchboardIntegration }>
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
  deleteSwitchboardIntegration(appId: string, switchboardId: string, switchboardIntegrationId: string): Promise<void>
  listSwitchboardIntegrations(
    appId: string,
    switchboardId: string
  ): Promise<{ switchboardIntegrations?: SwitchboardIntegration[] }>
}

// ============================================================================
// SwitchboardActionsApi Types
// ============================================================================

export type PassControlRequest = {
  switchboardIntegration: string
  metadata?: Record<string, string>
}

export type OfferControlRequest = {
  switchboardIntegration: string
  metadata?: Record<string, string>
}

export type ReleaseControlRequest = {
  reason?: string
}

export type SwitchboardActionsApi = {
  passControl(appId: string, conversationId: string, passControlBody: PassControlRequest): Promise<void>
  offerControl(appId: string, conversationId: string, offerControlBody: OfferControlRequest): Promise<void>
  releaseControl(appId: string, conversationId: string, releaseControlBody: ReleaseControlRequest): Promise<void>
}

// ============================================================================
// ClientsApi Types
// ============================================================================

export type Client = {
  id: string
  type?: string
  userId?: string
}

export type ClientsApi = {
  getClient(appId: string, userId: string, clientId: string): Promise<{ client: Client }>
  createClient(appId: string, userId: string, clientPost: { type?: string }): Promise<{ client: Client }>
  deleteClient(appId: string, userId: string, clientId: string): Promise<void>
  listClients(appId: string, userId: string): Promise<{ clients?: Client[] }>
}

// ============================================================================
// ParticipantsApi Types
// ============================================================================

export type Participant = {
  id: string
  userId?: string
  joinDate?: string
}

export type ParticipantsApi = {
  addParticipant(
    appId: string,
    conversationId: string,
    participantPost: { userId: string; subscribeSDKClient?: boolean }
  ): Promise<{ participant: Participant }>
  removeParticipant(appId: string, conversationId: string, participantId: string): Promise<void>
  listParticipants(appId: string, conversationId: string): Promise<{ participants?: Participant[] }>
}

// ============================================================================
// AttachmentsApi Types
// ============================================================================

export type Attachment = {
  id: string
  mediaUrl?: string
  mediaType?: string
  mediaSize?: number
}

export type AttachmentsApi = {
  getAttachment(appId: string, attachmentId: string): Promise<{ attachment: Attachment }>
  uploadAttachment(
    appId: string,
    attachmentPost: { source?: string; access?: string }
  ): Promise<{ attachment: Attachment }>
  deleteAttachment(appId: string, attachmentId: string): Promise<void>
}

// ============================================================================
// ActivitiesApi Types
// ============================================================================

export type Activity = {
  id: string
  type?: string
  author?: {
    type?: string
    userId?: string
  }
}

export type ActivitiesApi = {
  listActivities(
    appId: string,
    conversationId: string,
    page?: number,
    limit?: number
  ): Promise<{ activities?: Activity[] }>
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
