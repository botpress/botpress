import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'
import { Dropdown } from 'renderer/Dropdown'
import { Message, MessageConfig, MessageType, MessageTypeTuple, Payload } from 'typings'
import { FallthroughIntl } from 'utils'
import { Carousel, File, LoginPrompt, QuickReplies, Text } from './renderer'

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
  isLastGroup: true,
  isLastOfGroup: true,
  isBotMessage: true,
  noMessageBubble: false,
  intl: new FallthroughIntl(),
  showTimestamp: false,
  bp: window.botpress,
  messageId: `${(Math.random() * 1000000).toFixed(0)}`,
  sentOn: new Date(Date.now())
}

export function renderMessage(message: Message<MessageType>, renderer: Renderer = defaultRenderer): ReactElement {
  return renderer.render(message)
}

type MessageTypeHandler<T extends MessageType> = React.FC<Message<T>>

export class Renderer {
  private handlers: Map<string, MessageTypeHandler<MessageType>> = new Map()

  constructor() {
    this.add('unsupported', (message: Message<'unsupported'>) => <div>Unsupported message type: {message.type}</div>)
  }

  public add<T extends MessageType>(type: T, handler: MessageTypeHandler<T>) {
    this.handlers.set(type, handler)
  }

  public register(handlers: Partial<{ [key in MessageType]: MessageTypeHandler<key> }>) {
    for (const type in handlers) {
      this.add(type as MessageType, handlers[type]!)
    }
  }

  public get<T extends MessageType>(type: T): MessageTypeHandler<T | 'unsupported'> {
    const handler = this.handlers.get(type) || null
    if (!handler) {
      return this.get('unsupported')
    }
    return handler
  }

  public has(type: MessageType): boolean {
    return !!this.handlers.has(type)
  }

  public render(message: Message<MessageType>): ReactElement {
    const Handler = this.get(message.type)
    return <Handler {...message} />
  }

  public registerFallbackHandler(handler: MessageTypeHandler<'unsupported'>) {
    this.add('unsupported', handler)
  }
}

export const defaultTypesRenderers = {
  text: Text,
  quick_reply: QuickReplies,
  login_prompt: LoginPrompt,
  carousel: Carousel,
  file: File,
  video: File,
  audio: File,
  dropdown: Dropdown
}

const defaultRenderer = new Renderer()

defaultRenderer.register(defaultTypesRenderers)

export default defaultRenderer
