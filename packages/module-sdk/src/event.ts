import { EventDirection } from './common'

export type BotpressEventCtorArgs = {
  id?: Number
  type: string
  channel: string
  target: string
  direction: EventDirection
  preview?: string
  payload: any
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
 * @property {any} payload – The channel-specific raw payload
 */
export class BotpressEvent {
  public readonly id: Number
  public readonly type: string
  public readonly channel: string
  public readonly target: string
  public readonly direction: EventDirection
  public readonly payload: any
  public readonly preview: string

  constructor(args: BotpressEventCtorArgs) {
    this.type = args.type
    this.channel = args.channel
    this.direction = args.direction
    this.payload = args.payload
    this.target = args.target

    this.id = args.id || Date.now() * 100000 + ((Math.random() * 100000) | 0)
    this.preview = args.preview || this.constructPreview()
  }

  static toSingleChannelUser(type: string, channel: string, userId: string, payload: any): BotpressEvent {
    return new BotpressEvent({
      type,
      channel,
      target: userId,
      payload,
      direction: 'outgoing'
    })
  }

  static fromSingleChannelUser(type: string, channel: string, userId: string, payload: any): BotpressEvent {
    return new BotpressEvent({
      type,
      channel,
      target: userId,
      payload,
      direction: 'incoming'
    })
  }

  private constructPreview(): string {
    if (!this.payload) {
      return `"${this.type}" event on channel ${this.channel}`
    }

    return this.payload.__preview || this.payload.preview || this.payload.text
  }
}
