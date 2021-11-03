import { IO } from 'botpress/sdk'

export interface QueueOptions {
  retries: number
  drainInterval: number
}

export const defaultOptions: QueueOptions = { retries: 2, drainInterval: 2000 }

export interface JobWrapper<E extends IO.Event> {
  job: E
  id: string
  timestamp: Date
  retries: number
}

export type QueueConsumer<E extends IO.Event> = (message: E) => Promise<void>

export interface Queue<E extends IO.Event> {
  isEmpty(): boolean
  isEmptyForJob(job: E): boolean
  isQueueLockedForJob(job: E): boolean
  waitEmpty(job: E): Promise<void>
  enqueue(job: E, retries: number, isPriority: boolean): Promise<void>
  dequeue(): Promise<JobWrapper<E> | undefined>
  cancelAll(job: E): Promise<void>
  peek(job: E): Promise<JobWrapper<E> | undefined>
  subscribe(fn: QueueConsumer<E>): void
}
