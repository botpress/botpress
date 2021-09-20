import { InjectedIntl } from 'react-intl'

// copy pasted from channel-web/src/lite/typings.d.ts and modifed
export type uuid = string

export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}

export namespace Renderer {
  export interface StoreConfig {
    isEmulator?: boolean
    showTimestamp?: boolean
  }
  export interface MinimalRootStore {
    intl: InjectedIntl
    escapeHTML: boolean
    config: StoreConfig
    composer: any
    bp?: StudioConnector
  }
  export interface Message {
    type?: string
    className?: string
    payload?: any
    store?: MinimalRootStore
    bp?: StudioConnector
    fromLabel?: string
    messageId?: uuid
    /** When true, the message isn't wrapped by its bubble */
    noBubble?: boolean
    keyboard?: any
    eventId?: string

    isHighlighted?: boolean
    isLastGroup?: boolean
    isLastOfGroup?: boolean
    isBotMessage?: boolean
    isLastMessage?: boolean
    sentOn?: Date
    inlineFeedback?: any

    onSendData?: (data: any) => Promise<void>
    onFileUpload?: (label: string, payload: any, file: File) => Promise<void>

    /** Allows to autoplay voice messages coming from the bot */
    onAudioEnded?: () => void
    shouldPlay?: boolean
  }

  export type Button = {
    label: string
    payload: any
    preventDoubleClick: boolean
    onButtonClick: (title: any, payload: any) => void
  } & Pick<Message, 'onFileUpload'>

  export interface Text {
    text: string
    markdown: boolean
    escapeHTML: boolean
    intl?: any
    maxLength?: number
  }

  export interface Option {
    label: string
    value: string
  }

  export type Dropdown = {
    options: Option[]
    buttonText?: string
    escapeHTML: boolean
    allowCreation?: boolean
    placeholderText?: string
    allowMultiple?: boolean
    width?: number
    markdown: boolean
    message: string
    displayInKeyboard?: boolean
  } & Message

  export type QuickReply = {
    buttons: any
    quick_replies: any
    disableFreeText: boolean
  } & Message

  export type QuickReplyButton = {
    allowMultipleClick: boolean
    title: string
  } & Button

  export interface FileMessage {
    file: {
      url: string
      title: string
      storage: string
      text: string
    }
    escapeTextHTML: boolean
  }

  export interface VoiceMessage {
    file: {
      type: string
      audio: string
      autoPlay?: boolean
    }

    shouldPlay: boolean
    onAudioEnded: () => void
  }

  export interface FileInput {
    onFileChanged: (event: HTMLInputEvent) => void
    name: string
    className: string
    accept: string
    placeholder: string
    disabled?: boolean
  }

  export interface Carousel {
    elements: Card[]
    settings: any
  }

  export interface Card {
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
}

export interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget
}

/** These are the functions exposed by the studio to the modules */
export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}
