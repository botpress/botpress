import { BPStorage } from '../../../../../packages/ui-shared-lite/utils/storage'
import { RootStore } from './store'

declare global {
  interface Window {
    __BP_VISITOR_SOCKET_ID: string
    __BP_VISITOR_ID: string
    botpressWebChat: any
    store: RootStore
    BOT_API_PATH: string
    API_PATH: string
    BOTPRESS_VERSION: string
    BOT_NAME: string
    ROOT_PATH: string
    BOT_ID: string
    BP_BASE_PATH: string
    SEND_USAGE_STATS: boolean
    SHOW_POWERED_BY: boolean
    USE_SESSION_STORAGE: boolean
    BP_STORAGE: BPStorage
    botpress: {
      [moduleName: string]: any
    }
    APP_NAME: string
    APP_FAVICON: string
    APP_CUSTOM_CSS: string
  }
}

export namespace Renderer {
  export interface Message {
    type?: string
    className?: string
    payload?: any
    store?: RootStore
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

  export type Text = {
    text: string
    markdown: boolean
    escapeHTML: boolean
    intl?: any
    maxLength?: number
  } & Message

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
    displayInMessage?: boolean
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
    markdown: boolean
  }

  export interface CardButton {
    url: string
    title: string
    type: string
    payload: any
    text: string
  }
}

export namespace View {
  export type MenuAnimations = 'fadeIn' | 'fadeOut' | undefined
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

export interface Config {
  botId?: string
  externalAuthToken?: string
  userId?: string
  conversationId?: uuid
  /** Allows to set a different user id for different windows (eg: studio, specific bot, etc) */
  userIdScope?: string
  enableReset: boolean
  stylesheet: string
  isEmulator?: boolean
  extraStylesheet: string
  showConversationsButton: boolean
  showUserName: boolean
  showUserAvatar: boolean
  showTimestamp: boolean
  enableTranscriptDownload: boolean
  enableConversationDeletion: boolean
  enableArrowNavigation: boolean
  closeOnEscape: boolean
  botName?: string
  composerPlaceholder?: string
  avatarUrl?: string
  /** Force the display language of the webchat (en, fr, ar, ru, etc..)
   * Defaults to the user's browser language if not set
   * Set to 'browser' to force use the browser's language
   */
  locale?: 'browser' | string
  /** Small description written under the bot's name */
  botConvoDescription?: string
  /** Replace or insert components at specific locations */
  overrides?: Overrides
  /** When true, the widget button is hidden */
  hideWidget: boolean
  /** Disable the slide in / out animations of the webchat */
  disableAnimations: boolean
  /** When true, sets ctrl+Enter as shortcut for reset session then send */
  enableResetSessionShortcut: boolean
  /** When true, webchat tries to use native webspeech api (uses hosted mozilla and google voice services) */
  enableVoiceComposer: boolean
  recentConversationLifetime: string
  startNewConvoOnTimeout: boolean
  /** Use sessionStorage instead of localStorage, which means the session expires when tab is closed */
  useSessionStorage: boolean
  containerWidth?: string | number
  layoutWidth?: string | number
  showPoweredBy: boolean
  /** When enabled, sent messages are persisted to local storage (recall previous messages)  */
  enablePersistHistory: boolean
  /** Experimental: expose the store to the parent frame for more control on the webchat's behavior */
  exposeStore: boolean
  /** Reference ensures that a specific value and its signature are valid */
  reference: string
  /** If true, Websocket is created when the Webchat is opened. Bot cannot be proactive. */
  lazySocket?: boolean
  /** If true, chat will no longer play the notification sound for new messages. */
  disableNotificationSound?: boolean
  /** Refers to a specific webchat reference in parent window. Useful when using multiple chat window */
  chatId?: string
  /** CSS class to be applied to iframe */
  className?: string
  /** Force the display to use a specific mode (Fullscreen or Embedded)
   * Defaults to 'Embedded'
   */
  viewMode?: 'Embedded' | 'Fullscreen'
}

type OverridableComponents = 'below_conversation' | 'before_container' | 'composer' | 'before_widget'

interface Overrides {
  [componentToOverride: string]: [
    {
      module: string
      component: string
    }
  ]
}

interface BotDetails {
  website?: string
  phoneNumber?: string
  termsConditions?: string
  privacyPolicy?: string
  emailAddress?: string
  avatarUrl?: string
}

export interface BotInfo {
  name: string
  description: string
  details: BotDetails
  showBotInfoPage: boolean
  languages: string[]
  security: {
    escapeHTML: boolean
  }
  lazySocket: boolean
  maxMessageLength: number
  alwaysScrollDownOnMessages: boolean
}

export type uuid = string

export interface Conversation {
  id: uuid
  clientId: uuid
  userId: uuid
  createdOn: Date
}

export interface RecentConversation extends Conversation {
  lastMessage?: Message
}

/** Represents the current conversation with all messages */
export type CurrentConversation = {
  botId: string
  messages: Message[]
  userId: string
  user_last_seen_on: Date | undefined
  /** Event ?  */
  typingUntil: any
} & Conversation

export interface Message {
  id: uuid
  conversationId: uuid
  authorId: uuid | undefined
  sentOn: Date
  payload: any
  // The typing delay in ms
  timeInMs: number
}

export interface QueuedMessage {
  message: Message
  showAt: Date
}

export interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget
}

interface ChatDimensions {
  /**
   * The container is the frame around the webchat.
   * Setting the container bigger than the layout makes it possible to add components
   */
  container: string | number
  /** The layout is the zone where the user speaks with the bot */
  layout: string | number
}

interface CustomButton {
  /** An ID to identify your button. It is required to remove it */
  id: string
  /** This text will be displayed when the mouse is over the button */
  label?: string
  /** Supply either a function or an element which will render the button */
  icon: Function | JSX.Element
  /** The event triggered when the button is clicked */
  onClick: (buttonId: string, headerComponent: JSX.Element, event: React.MouseEvent) => void
}

interface CustomAction {
  /** An ID to identify your action. It is required to remove it */
  id: string
  /** This text will be displayed in the context menu */
  label: string
  /** The event triggered when the action is clicked */
  onClick: (actionId: string, messageProps: any, event: React.MouseEvent) => void
}

/** When set, this will wrap every messages displayed in the webchat */
interface MessageWrapper {
  /** The name of the module hosting the component */
  module: string
  /** Name of the component exposed by the module */
  component: string
}

export interface EventFeedback {
  messageId: uuid
  feedback?: number
}
