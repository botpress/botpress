import { EventDirection } from './common'

export type BotpressEventCtorArgs = {
  id?: Number
  type: string
  channel: string
  target: string
  direction: EventDirection
  preview?: string
  payload: any
  threadId?: string
  botId: string
}

/**
 * TODO Document this
 */
export namespace WellKnownEventFlags {
  export const SKIP_DIALOG_ENGINE = 'skipDialogEngine'
}

/**
 * @description
 * A BotpressEvent is how conversational channels interact with Botpress.  Events represent all the interactions
 * that make up a conversation.  That means the different message types (text, image, buttons, carousels etc) but also
 * the navigational events (chat open, user typing) and contextual events (user returned home, order delivered).
 * @property {string} type - The type of the event, i.e. image, text, timeout, etc
 * @property {string} channel - The channel of communication, i.e web, messenger, twillio
 * @property {string} target - Who will receive this message, usually a user's id
 * @property {EventDirection} direction – Is it (in)coming from the user to the bot or (out)going from the bot to the user?
 * @property {string} preview – A textual representation of the event
 * @property {string} [threadId] – The id of the thread this message is relating to (only on supported channels)
 * @property {string} botId – The id of the bot on which this event is relating to
 * @property {any} payload – The channel-specific raw payload
 */
export class BotpressEvent {
  public readonly id: Number
  public readonly type: string
  public readonly channel: string
  public readonly target: string
  public readonly direction: EventDirection
  public readonly payload: any
  public readonly botId: string
  public readonly threadId?: string
  public readonly preview: string
  private readonly flags: any

  constructor(args: BotpressEventCtorArgs) {
    this.type = args.type
    this.channel = args.channel
    this.direction = args.direction
    this.payload = args.payload
    this.target = args.target
    this.botId = args.botId

    this.threadId = args.threadId ? args.threadId.toString() : undefined
    this.id = args.id || Date.now() * 100000 + ((Math.random() * 100000) | 0)
    this.preview = args.preview || this.constructPreview()
    this.flags = {}
  }

  public hasFlag(flag: string): boolean {
    return Boolean(this.flags[flag.toLowerCase()])
  }

  public setFlag(flag: string, value: boolean) {
    this.flags[flag.toLowerCase()] = value
  }

  private constructPreview(): string {
    if (!this.payload) {
      return `"${this.type}" event on channel ${this.channel}`
    }

    return this.payload.__preview || this.payload.preview || this.payload.text
  }
}
