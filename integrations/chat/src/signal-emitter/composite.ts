import { Signal, SignalEmitter } from './typings'

export class CompositeSignalEmiter implements SignalEmitter {
  public constructor(private _emitters: SignalEmitter[]) {}

  public async emit(channel: string, signal: Signal): Promise<void> {
    await Promise.all(this._emitters.map((emitter) => emitter.emit(channel, signal)))
  }

  public async close(channel: string): Promise<void> {
    await Promise.all(this._emitters.map((emitter) => emitter.close(channel)))
  }
}
