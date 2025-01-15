import { EventEmitter } from './event-emitter'
import { listenEventSource, EventSourceEmitter, MessageEvent, ErrorEvent } from './eventsource'
import { zod as signals, Types } from './gen/signals'
import { WatchDog } from './watchdog'

const CONNECTION_TIMEOUT = 60_000
const DEFAULT_ERROR_MESSAGE = 'unknown error'

type ValueOf<T> = T[keyof T]

type _Signals = Types & {
  unknown: {
    type: 'unknown'
    data: unknown
  }
}

type SignalListenerState =
  | {
      status: 'disconnected'
    }
  | {
      status: 'connecting'
      connectionPromise: Promise<EventSourceEmitter>
    }
  | {
      status: 'connected'
      source: EventSourceEmitter
      watchdog: WatchDog
    }

export type Signals = {
  [K in keyof _Signals as _Signals[K]['type']]: _Signals[K]['data']
}

type Events = Signals & {
  error: Error
}

export type SignalListenerStatus = SignalListenerState['status']

export type SignalListenerProps = {
  url: string
  userKey: string
  conversationId: string
  debug: boolean
}

export class SignalListener extends EventEmitter<Events> {
  private _state: SignalListenerState = { status: 'disconnected' }

  private constructor(private _props: SignalListenerProps) {
    super()
  }

  public static listen = async (props: SignalListenerProps): Promise<SignalListener> => {
    const inst = new SignalListener(props)
    await inst.connect()
    return inst
  }

  public get status(): SignalListenerStatus {
    return this._state.status
  }

  public readonly connect = async (): Promise<void> => {
    if (this._state.status === 'connected') {
      return
    }

    if (this._state.status === 'connecting') {
      await this._state.connectionPromise
      return
    }

    const connectionPromise = this._connect()

    this._state = { status: 'connecting', connectionPromise }

    await connectionPromise
  }

  public readonly disconnect = async (): Promise<void> => {
    if (this._state.status === 'disconnected') {
      return
    }

    let source: EventSourceEmitter
    let watchdog: WatchDog | undefined
    if (this._state.status === 'connecting') {
      source = await this._state.connectionPromise
    } else {
      source = this._state.source
      watchdog = this._state.watchdog
    }

    this._disconnectSync(source, watchdog)
  }

  private _connect = async (): Promise<EventSourceEmitter> => {
    const source = await listenEventSource(`${this._props.url}/conversations/${this._props.conversationId}/listen`, {
      headers: { 'x-user-key': this._props.userKey },
    })

    const watchdog = WatchDog.init(CONNECTION_TIMEOUT)

    source.on('message', this._handleMessage(source, watchdog))
    source.on('error', this._handleError(source, watchdog))
    watchdog.on('error', this._handleError(source, watchdog))

    this._state = { status: 'connected', source, watchdog }
    return source
  }

  private _disconnectSync = (source: EventSourceEmitter, watchdog?: WatchDog): void => {
    source.close()
    watchdog?.close()
    this._state = { status: 'disconnected' }
  }

  private _handleMessage = (_source: EventSourceEmitter, watchdog: WatchDog) => (ev: MessageEvent) => {
    watchdog.reset()
    const signal = this._parseSignal(ev.data)
    this.emit(signal.type, signal.data)
  }

  private _handleError = (source: EventSourceEmitter, watchdog: WatchDog) => (ev: ErrorEvent | Error) => {
    this._disconnectSync(source, watchdog)
    const err = this._toError(ev)
    this.emit('error', err)
  }

  private _parseSignal = (data: unknown): ValueOf<_Signals> => {
    for (const [schemaName, schema] of Object.entries(signals)) {
      this._debug('trying to parse', schemaName)
      const parsedData = this._safeJsonParse(data)
      const parseResult = schema.safeParse(parsedData)
      if (parseResult.success) {
        this._debug('parsing successfull', schemaName, parseResult.data)
        return parseResult.data
      }
    }
    return {
      type: 'unknown',
      data,
    }
  }

  private _safeJsonParse = (x: any) => {
    try {
      return JSON.parse(x)
    } catch {
      return x
    }
  }

  private _toError = (thrown: unknown): Error => {
    if (thrown instanceof Error) {
      return thrown
    }
    if (typeof thrown === 'string') {
      return new Error(thrown)
    }
    if (thrown === null) {
      return new Error(DEFAULT_ERROR_MESSAGE)
    }
    if (typeof thrown === 'object' && 'message' in thrown) {
      return this._toError(thrown.message)
    }
    try {
      const json = JSON.stringify(thrown)
      return new Error(json)
    } catch {
      return new Error(DEFAULT_ERROR_MESSAGE)
    }
  }

  private _debug = (...args: any[]) => {
    if (!this._props.debug) {
      return
    }
    console.info(...args)
  }
}
