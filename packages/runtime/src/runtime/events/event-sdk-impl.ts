import * as sdk from 'botpress/sdk'

export class IOEvent implements sdk.IO.Event {
  public readonly id: string
  public readonly type: string
  public readonly channel: string
  public readonly target: string
  public readonly direction: sdk.EventDirection
  public readonly payload: any
  public readonly botId: string
  public readonly createdOn: Date
  public readonly threadId?: string
  public readonly preview: string
  public readonly suggestions?: sdk.IO.Suggestion[]
  public readonly state: any
  public readonly credentials?: any
  public readonly incomingEventId?: string
  public readonly debugger?: boolean
  public readonly messageId?: string
  private readonly flags: any
  private readonly nlu?: sdk.IO.EventUnderstanding

  constructor(args: sdk.IO.EventCtorArgs) {
    this.type = args.type
    this.channel = args.channel
    this.direction = args.direction
    this.payload = args.payload
    this.target = args.target
    this.botId = args.botId
    this.createdOn = new Date()
    this.threadId = args.threadId ? args.threadId.toString() : undefined
    this.id = this.makeId()
    this.preview = args.preview || this.constructPreview()
    this.flags = {}
    this.state = { __stacktrace: [] }
    this.debugger = args.debugger
    this.messageId = args.messageId
    args.nlu = args.nlu || {}

    if (this.direction === 'incoming') {
      this.suggestions = args.suggestions || []
      this.credentials = args.credentials
    }

    if (this.direction === 'outgoing') {
      this.incomingEventId = args.incomingEventId
    }

    this.nlu = {
      entities: [],
      language: 'n/a',
      detectedLanguage: undefined,
      spellChecked: undefined,
      ambiguous: false,
      slots: {},
      intent: { name: 'none', confidence: 1, context: 'global' },
      intents: [],
      errored: false,
      includedContexts: ['global'],
      ms: 0,
      modelId: undefined,
      ...args.nlu
    }
  }

  private makeId(): string {
    // nanosecond temporal + 3 rand digits
    return `${process.hrtime.bigint()}${Math.random()
      .toString()
      .slice(-3)}`
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
