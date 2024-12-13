import * as chat from '@botpress/chat'
import * as readline from 'readline'
import * as uuid from 'uuid'
import * as utils from '../utils'

export type ChatProps = {
  client: chat.AuthenticatedClient
  conversationId: string
}

export type ChatState = {
  running: boolean
  messages: chat.Message[]
}

export class Chat {
  private _events = new utils.emitter.EventEmitter<{ state: ChatState }>()
  private _state: ChatState = { running: false, messages: [] }

  public static async launch(props: ChatProps): Promise<Chat> {
    const instance = new Chat(props)
    instance._setState({ running: true })
    void instance._run()
    return instance
  }

  private constructor(private _props: ChatProps) {}

  private async _run() {
    const listener = await this._props.client.listenConversation({ id: this._props.conversationId })
    listener.on('message_created', (message) => {
      if (message.userId === this._props.client.user.id) {
        return
      }
      this._setState({ messages: [...this._state.messages, message] })
      this._renderMessages()
    })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const exit = async () => {
      await listener.disconnect()
      listener.cleanup()
      rl.close()
    }

    this._renderMessages()

    rl.on('line', (line) => {
      if (line === 'exit') {
        void exit()
        this._setState({ running: false })
        return
      }
      if (!line) {
        this._renderMessages()
        return
      }
      void this._props.client.createMessage({
        conversationId: this._props.conversationId,
        payload: { type: 'text', text: line },
      })
      this._setState({ messages: [...this._state.messages, this._textToMessage(line)] })
      this._renderMessages()
      return
    })
  }

  private _setState(state: Partial<ChatState>) {
    const newState = { ...this._state, ...state }
    this._state = newState
    this._events.emit('state', this._state)
  }

  public wait(): Promise<void> {
    return new Promise<void>((resolve) => {
      const cb = (state: ChatState) => {
        if (!state.running) {
          this._events.off('state', cb)
          resolve()
        }
      }
      this._events.on('state', cb)
    })
  }

  private _renderMessages() {
    this._clearStdOut()
    for (const message of this._state.messages) {
      process.stdout.write(`[${message.userId}] ${this._messageToText(message)}\n`)
    }
    process.stdout.write('>> ')
  }

  private _clearStdOut() {
    process.stdout.write('\x1Bc')
  }

  private _messageToText = (message: chat.Message): string => {
    switch (message.payload.type) {
      case 'audio':
        return message.payload.audioUrl
      case 'card':
        return '<card>' // TODO: implement something better
      case 'carousel':
        return '<carousel>' // TODO: implement something better
      case 'choice':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'dropdown':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'file':
        return message.payload.fileUrl
      case 'image':
        return message.payload.imageUrl
      case 'location':
        return `${message.payload.latitude},${message.payload.longitude} (${message.payload.address})`
      case 'text':
        return message.payload.text
      case 'video':
        return message.payload.videoUrl
      case 'markdown':
        return message.payload.markdown
      default:
        type _assertion = utils.types.AssertNever<typeof message.payload>
        return '<unknown>'
    }
  }

  private _textToMessage = (text: string): chat.Message => {
    return {
      id: uuid.v4(),
      userId: this._props.client.user.id,
      conversationId: this._props.conversationId,
      createdAt: new Date().toISOString(),
      payload: { type: 'text', text },
    }
  }
}
