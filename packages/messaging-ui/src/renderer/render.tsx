import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'
import { InjectedIntl } from 'react-intl'
import { Carousel, File, LoginPrompt, QuickReplies, Text, VoiceMessage } from '.'
import { Dropdown } from './Dropdown'

export type uuid = string

const messageTypes = [
  'text',
  'audio',
  'video',
  'file',
  'dropdown',
  'visit',
  'voice',
  'typing',
  'carousel',
  'login_prompt',
  'quick_reply',
  'session_reset',
  'custom'
] as const

type MessageTypeTuple = typeof messageTypes

export type MessageType = MessageTypeTuple[number]

class FallthroughIntl implements InjectedIntl {
  formats: any
  messages: { [id: string]: string } = {}
  defaultLocale: string = 'en'
  defaultFormats: any
  constructor(public locale: string = 'en') {}

  formatDate(value: ReactIntl.DateSource, options?: ReactIntl.IntlComponent.DateTimeFormatProps): string {
    throw new Error('Method not implemented.')
  }
  formatTime(value: ReactIntl.DateSource, options?: ReactIntl.IntlComponent.DateTimeFormatProps): string {
    throw new Error('Method not implemented.')
  }
  formatRelative(value: ReactIntl.DateSource, options?: ReactIntl.FormattedRelative.PropsBase & { now?: any }): string {
    throw new Error('Method not implemented.')
  }
  formatNumber(value: number, options?: ReactIntl.FormattedNumber.PropsBase): string {
    throw new Error('Method not implemented.')
  }
  formatPlural(value: number, options?: ReactIntl.FormattedPlural.Base): keyof ReactIntl.FormattedPlural.PropsBase {
    throw new Error('Method not implemented.')
  }

  formatMessage(
    messageDescriptor: ReactIntl.FormattedMessage.MessageDescriptor,
    values?: { [key: string]: ReactIntl.MessageValue }
  ): string {
    return messageDescriptor.defaultMessage || 'Missing default message'
  }

  formatHTMLMessage(
    messageDescriptor: ReactIntl.FormattedMessage.MessageDescriptor,
    values?: { [key: string]: ReactIntl.MessageValue }
  ): string {
    throw new Error('Method not implemented.')
  }
  now(): number {
    throw new Error('Method not implemented.')
  }
  onError(error: string): void {
    throw new Error('Method not implemented.')
  }
}

export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}
declare global {
  export interface Window {
    botpress?: StudioConnector
  }
}

export const defaultMessageConfig: MessageConfig = {
  escapeHTML: true,
  isInEmulator: false,
  onSendData: async () => {
    return
  },
  onFileUpload: async (label, payload, file) => {
    return
  },
  onMessageClicked: messageId => {
    return
  },
  noMessageBubble: false,
  intl: new FallthroughIntl(),
  showTimestamp: false,
  bp: window.botpress
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
  url: string
  title: string
  type: string
  payload: any
  text: string
}

export enum ButtonAction {
  SaySomething = 'Say something',
  OpenUrl = 'Open URL',
  Postback = 'Postback'
}

export interface CarouselPayload {
  carousel: {
    elements: CardPayload[]
  }
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
  ? {}
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

export function renderMessage(message: Message<MessageType>): ReactElement | null {
  const { type } = message
  if (!isSupportedMessageType(type)) {
    return <>* Unsupported message type *</>
  }
  switch (type) {
    case 'text':
      return <Text {...(message as Message<'text'>)} />
    case 'audio':
      return <File {...(message as Message<'file'>)} />
    case 'video':
      return <File {...(message as Message<'file'>)} />
    case 'file':
      return <File {...(message as Message<'file'>)} />
    // case 'dropdown':
    //   return <Dropdown {...payload} {...config} />
    // case 'visit':
    //   return null
    // case 'voice':
    //   return <VoiceMessage {...payload} {...config} />
    // case 'typing':
    //   return null
    // case 'carousel':
    //   return <Carousel {...payload} {...config} />
    // case 'login_prompt':
    //   return <LoginPrompt {...payload} {...config} />
    // case 'quick_reply':
    //   return <QuickReplies {...payload} {...config} />
    // case 'session_reset':
    //   return null
    // case 'custom':
    //   return null
    default:
      return <>* Unsupported message type *</>
  }
}

const isSupportedMessageType = (type: string): type is MessageType => {
  return type in messageTypes
}
