import * as chat from '@botpress/chat'
import * as utils from '../utils'

export type ChatProps = {
  client: chat.AuthenticatedClient
  conversationId: string
}

export type ChatState = {
  running: boolean
}

export class Chat {
  private _events = new utils.emitter.EventEmitter<{ state: ChatState }>()
  private _state: ChatState = { running: false }

  public static async launch(props: ChatProps): Promise<Chat> {
    const instance = new Chat(props)
    instance._setState({ running: true })
    void instance._run()
    return instance
  }

  private constructor(private _props: ChatProps) {}

  private async _run() {
    while (this._state.running) {
      await utils.promises.sleep(1000)
    }
  }

  private _setState(newState: ChatState) {
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
}

// eslint-disable-next-line unused-imports/no-unused-vars
const renderMessage = (message: chat.Message): string => {
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
