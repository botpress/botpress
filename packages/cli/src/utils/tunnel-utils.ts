import { TunnelTail, ClientCloseEvent, ClientErrorEvent } from '@bpinternal/tunnel'
import { Logger } from '../logger'
import { EventEmitter } from './event-emitter'

export type ReconnectionTriggerEvent =
  | {
      type: 'init'
      ev: null
    }
  | {
      type: 'error'
      ev: ClientErrorEvent
    }
  | {
      type: 'close'
      ev: ClientCloseEvent
    }

export type ReconnectedEvent = {
  tunnel: TunnelTail
  ev: ReconnectionTriggerEvent
}

export class ReconnectionFailedError extends Error {
  public constructor(public readonly event: ReconnectionTriggerEvent) {
    const reason = ReconnectionFailedError._reason(event)
    super(`Reconnection failed: ${reason}`)
  }

  private static _reason(event: ReconnectionTriggerEvent): string {
    if (event.type === 'error') {
      return 'error'
    }

    if (event.type === 'close') {
      return `${event.ev.code} ${event.ev.reason}`
    }

    return 'init'
  }
}

export class TunnelSupervisor {
  private _tunnel?: TunnelTail
  private _closed = false
  private _started = false

  public readonly events = new EventEmitter<{
    connectionFailed: ReconnectionTriggerEvent
    manuallyClosed: null
    connected: {
      tunnel: TunnelTail
      ev: ReconnectionTriggerEvent
    }
  }>()

  constructor(private _tunnelUrl: string, private _tunnelId: string, private _logger: Logger) {}

  public async start(): Promise<void> {
    if (this._closed) {
      throw new Error('Cannot start: Tunnel is closed')
    }
    if (this._started) {
      throw new Error('Cannot start: Tunnel is already started')
    }

    this._started = true
    const tunnel = await this._reconnect({ type: 'init', ev: null })
    this._tunnel = tunnel
  }

  public get closed(): boolean {
    return this._closed
  }

  /**
   * @returns Promise that rejects when a reconnection attempt fails and resolves when the tunnel is closed manually
   */
  public async wait(): Promise<void> {
    if (this._closed) {
      throw new Error('Cannot wait: Tunnel is closed')
    }

    return new Promise((resolve, reject) => {
      this.events.on('connectionFailed', (ev) => {
        reject(new ReconnectionFailedError(ev))
      })

      this.events.on('manuallyClosed', () => {
        resolve()
      })
    })
  }

  public close(): void {
    if (this._closed) {
      return
    }

    this._closed = true
    this._tunnel?.close()
    this.events.emit('manuallyClosed', null)
  }

  private _reconnectSync(ev: ReconnectionTriggerEvent): void {
    void this._reconnect(ev)
      .then((t) => {
        this._tunnel = t
      })
      .catch(() => this.events.emit('connectionFailed', ev))
  }

  private async _reconnect(ev: ReconnectionTriggerEvent): Promise<TunnelTail> {
    const newTunnel = async () => {
      const tunnel = await TunnelTail.new(this._tunnelUrl, this._tunnelId)
      this._registerListeners(tunnel)
      this.events.emit('connected', { tunnel, ev })
      return tunnel
    }

    if (ev.type === 'init') {
      // skip logging on the first connection attempt
      return newTunnel()
    }

    const line = this._logger.line()
    line.started('Reconnecting tunnel...')
    const tunnel = await newTunnel()
    line.success('Reconnected')
    line.commit()
    return tunnel
  }

  private _registerListeners(tunnel: TunnelTail) {
    tunnel.events.on('error', ({ target, type }) => {
      this._logger.error(`Tunnel error: ${type}`)
      this._reconnectSync({ type: 'error', ev: { target, type } })
    })
    tunnel.events.on('close', ({ code, reason, target, type, wasClean }) => {
      this._logger.error(`Tunnel closed: ${code} ${reason}`)
      this._reconnectSync({ type: 'close', ev: { code, reason, target, type, wasClean } })
    })
  }
}
