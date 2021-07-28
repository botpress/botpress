declare module 'botpress/apiSdk' {
  import { IO, SearchParams } from 'botpress/sdk'

  export interface SdkApiPayload {
    botId: string
    workspace: string
    scopes: string[]
  }

  export interface SetAttributes {
    channel: string
    userId: string
    attributes: any
  }

  export interface ReplyToEvent {
    event: IO.IncomingEvent | IO.EventDestination
    contentId?: string
    args?: any
    payloads?: any[]
  }

  export interface KvsSet {
    botId?: string
    key: string
    value: any
    path?: string
    expiry?: string
  }

  export interface KvsGet {
    botId?: string
    key: string
    path?: string
  }

  export interface CmsSearchContentElements {
    botId: string
    contentTypeId?: string
    searchParams?: SearchParams
    language?: string
  }
}
