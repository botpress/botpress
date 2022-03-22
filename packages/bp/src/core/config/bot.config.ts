/** ONLY FOR SCHEMA BUILDING - ALSO EDIT IN BOTPRESS.D.TS */

export interface BotConfig {
  $schema?: string
  id: string
  name: string
  description?: string
  category?: string
  details: BotDetails
  author?: string
  disabled?: boolean
  private?: boolean
  version: string
  imports: {
    /** Defines the list of content types supported by the bot */
    contentTypes: string[]
  }
  messaging?: MessagingConfig
  converse?: ConverseConfig
  dialog?: BotDialogConfig
  logs?: BotLogsConfig
  defaultLanguage: string
  languages: string[]
  locked: boolean
  pipeline_status: BotPipelineStatus
  oneflow?: boolean
  qna: {
    disabled: boolean
  }
}

export interface BotPipelineStatus {
  current_stage: {
    promoted_by: string
    promoted_on: Date
    id: string
  }
  stage_request?: {
    requested_on: Date
    expires_on?: Date
    requested_by: string
    id: string
    approvals?: StageRequestApprovers[]
  }
}

export interface StageRequestApprovers {
  email: string
  strategy: string
}

export interface BotDetails {
  website?: string
  phoneNumber?: string
  termsConditions?: string
  privacyPolicy?: string
  emailAddress?: string
}

export interface BotLogsConfig {
  expiration: string
}

export interface BotDialogConfig {
  /**
   * The interval until the context of the session expires.
   * This clears the position of the user in the flow and triggers the before_session_timeout hook
   * @default 25m
   */
  timeoutInterval: string
  /**
   * The interval until the session timeout. The default value is 30m. This deletes the session from the database.
   */
  sessionTimeoutInterval?: string
}

export interface ConverseConfig {
  /**
   * The timeout of the converse API requests
   * @default 5s
   */
  timeout: string
  /**
   * The text limitation of the converse API requests
   * @default 360
   */
  maxMessageLength: number
  /**
   * Number of milliseconds that the converse API will wait to buffer responses
   * @default 250
   */
  bufferDelayMs: number
  /**
   * Whether or not you want to expose public converse API. See docs here https://botpress.com/docs/channels/converse#public-api
   * @default true
   */
  enableUnsecuredEndpoint: boolean
}

export interface MessagingConfig {
  /**
   * Configurations of channels to be sent to the messaging server
   * You can find more about channel configurations here : https://botpress.com/docs/channels/faq
   */
  channels: { [channelName: string]: any }
}
