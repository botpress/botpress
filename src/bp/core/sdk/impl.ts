import * as sdk from 'botpress/sdk'

export class RealTimePayload {
  readonly eventName: string
  readonly payload: any

  constructor(eventName: string, payload: any) {
    this.eventName = eventName.toLowerCase()
    this.payload = payload
  }

  /**
   * Creates a payload to be send to a unique visitor.
   * A visitor is essentially a unique socket user surfing a Botpress-enabled interface.
   * Interfaces include the Botpress Dashboard and the Botpress Webchat.
   * @param visitorId The ID of the visitor, on the Webchat this is the channel-web `userId`
   */
  static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload {
    if (!eventName.toLowerCase().startsWith('guest.')) {
      eventName = 'guest.' + eventName
    }

    return new RealTimePayload(eventName, {
      ...payload,
      __room: `visitor:${visitorId}`
    })
  }

  public static forAdmins(eventName: string, payload: any): RealTimePayload {
    return new RealTimePayload(eventName, payload)
  }
}

export class IOEvent implements sdk.IO.Event {
  public readonly id: Number
  public readonly type: string
  public readonly channel: string
  public readonly target: string
  public readonly direction: sdk.EventDirection
  public readonly payload: any
  public readonly botId: string
  public readonly threadId?: string
  public readonly preview: string
  private readonly flags: any

  constructor(args: sdk.IO.EventCtorArgs) {
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

  public hasFlag(flag: symbol): boolean {
    return Boolean(this.flags[flag])
  }

  public setFlag(flag: symbol, value: boolean) {
    this.flags[flag] = value
  }

  private constructPreview(): string {
    if (!this.payload) {
      return `"${this.type}" event on channel ${this.channel}`
    }

    return this.payload.__preview || this.payload.preview || this.payload.text
  }
}

export const Event: sdk.IO.EventConstructor = (args: sdk.IO.EventCtorArgs) => new IOEvent(args)
