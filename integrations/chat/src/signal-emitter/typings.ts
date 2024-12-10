import { Types as Signals } from '../gen/signals'

type ValueOf<T> = T[keyof T]
export type Signal = ValueOf<Signals>
export type MessageCreatedSignal = Signals['messageCreated']
export type EventCreatedSignal = Signals['eventCreated']

export type SignalEmitter = {
  emit(channel: string, signal: Signal): Promise<void>
  close(channel: string): Promise<void>
}
