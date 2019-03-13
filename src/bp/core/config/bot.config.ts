/** ONLY FOR SCHEMA BUILDING - ALSO EDIT IN BOTPRESS.D.TS */

export type BotConfig = {
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
  dialog?: DialogConfig
  logs?: LogsConfig
}

export interface BotDetails {
  website?: string
  phoneNumber?: string
  termsConditions?: string
  privacyPolicy?: string
  emailAddress?: string
}

export interface LogsConfig {
  expiration: string
}

export interface DialogConfig {
  timeoutInterval: string
  sessionTimeoutInterval: string
}
