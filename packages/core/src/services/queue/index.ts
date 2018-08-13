import { BotpressEvent } from '../../misc/interfaces'

export interface QueueOptions {
  retries: number
  drainInterval: number
}

export const defaultOptions: QueueOptions = { retries: 2, drainInterval: 2000 }

export type Job = {
  event: BotpressEvent
}

export interface JobWrapper {
  job: Job
  id: string
  timestamp: Date
  retries: number
}

export interface Queue {
  enqueue(job: Job, retries: number, isPriority: boolean): Promise<void>
  dequeue(): Promise<JobWrapper | undefined>
  cancelAll(job: Job): Promise<void>
  peek(job: Job): Promise<JobWrapper | undefined>
  subscribe(fn: Function): void
}
