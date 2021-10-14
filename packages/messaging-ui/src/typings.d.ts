import { Settings as CarouselSettings } from 'react-slick'
import { messageTypes } from './utils'

declare global {
  export interface Window {
    botpress?: StudioConnector
  }
}

export type uuid = string

export type FileUploadHandler = (label: string, payload: any, file: File) => Promise<void>

export interface LiteStore {
  composer: {
    setLocked: (locked: boolean) => void
  }
}
export interface MessageConfig {
  messageId: uuid
  authorId?: uuid
  sentOn: Date
  escapeHTML: boolean
  isInEmulator: boolean
  intl: InjectedIntl
  showTimestamp: boolean
  noMessageBubble: boolean
  isLastGroup: boolean
  isLastOfGroup: boolean
  isBotMessage: boolean
  bp?: StudioConnector
  store?: LiteStore
  onSendData: (data: any) => Promise<void>
  onFileUpload: FileUploadHandler
  onMessageClicked: (messageId?: uuid) => void
  onAudioEnded?: React.EventHandler<HTMLMediaElementEventMap['ended']>
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

export interface DropdownOption {
  label: string
  value: string
}
export interface DropdownPayload {
  options: DropdownOption[]
  buttonText?: string
  escapeHTML: boolean
  allowCreation?: boolean
  placeholderText?: string
  allowMultiple?: boolean
  width?: number
  markdown: boolean
  message: string
  displayInKeyboard?: boolean
}

interface QuickReply {
  title: string
  payload: string
}
export interface QuickReplyPayload extends TextMessagePayload {
  quick_replies: QuickReply[]
  disableFreeText?: boolean
}

export interface LoginPromptPayload {}

export interface VoiceMessagePayload {
  shouldPlay: boolean
  file: {
    audio: string
    autoPlay: boolean
  }
}

export interface CustomComponentPayload
  extends Optional<
    Pick<
      MessageConfig,
      | 'messageId'
      | 'isLastGroup'
      | 'isLastOfGroup'
      | 'isBotMessage'
      | 'onSendData'
      | 'onFileUpload'
      | 'sentOn'
      | 'store'
      | 'intl'
    >
  > {
  module: string
  component: string
  wrapped?: any
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
  ? LoginPromptPayload
  : T extends 'quick_reply'
  ? QuickReplyPayload
  : T extends 'visit'
  ? {}
  : T extends 'voice'
  ? VoiceMessagePayload
  : T extends 'typing'
  ? {}
  : T extends 'dropdown'
  ? DropdownPayload
  : T extends 'custom'
  ? CustomComponentPayload
  : T extends 'unsupported'
  ? any
  : never

export type MessageTypeHandlerProps<T extends MessageType> = Omit<Message<T>, 'type'> & {
  type?: T // makes passing type prop to Components optional
}
