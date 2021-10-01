import { Settings as CarouselSettings } from 'react-slick'
import { messageTypes } from './utils'

export type uuid = string
declare global {
  export interface Window {
    botpress?: StudioConnector
  }
}

export interface MessageConfig {
  escapeHTML: boolean
  isInEmulator: boolean
  intl: InjectedIntl
  showTimestamp: boolean
  noMessageBubble: boolean
  bp?: StudioConnector
  onSendData: (data: any) => Promise<void>
  onFileUpload: (label: string, payload: any, file: File) => Promise<void>
  onMessageClicked: (messageId?: uuid) => void
}

export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}

type MessageTypeTuple = typeof messageTypes

export type MessageType = MessageTypeTuple[number]

export interface Message<T extends MessageType> {
  type: T
  payload: Payload<T>
  config: MessageConfig
}
interface FilePayload {
  file: {
    url: string
    title?: string
    storage?: 'local' | string
    text?: string
  }
}

export interface TextMessagePayload {
  text: string
  markdown: boolean
  trimLength?: number
}

export interface CardPayload {
  picture: string
  title: string
  subtitle: string
  buttons: CardButton[]
}

export interface CardButton {
  url?: string
  title: string
  type?: 'postback' | 'say_something' | string
  payload?: any
  text?: string
}

export interface CarouselPayload {
  carousel: {
    elements: CardPayload[]
    settings?: CarouselSettings
  }
  style?: { [key: string]: any }
}

export type Payload<T extends MessageType> = T extends 'text'
  ? TextMessagePayload
  : T extends 'file'
  ? FilePayload
  : T extends 'audio'
  ? FilePayload
  : T extends 'video'
  ? FilePayload
  : T extends 'carousel'
  ? CarouselPayload
  : T extends 'login_prompt'
  ? {}
  : T extends 'quick_reply'
  ? {}
  : T extends 'visit'
  ? {}
  : T extends 'voice'
  ? {}
  : T extends 'typing'
  ? {}
  : T extends 'dropdown'
  ? {}
  : T extends 'custom'
  ? {}
  : never

export type MessageRendererProps<T extends MessageType> = Pick<Message<T>, 'payload' | 'config'>
