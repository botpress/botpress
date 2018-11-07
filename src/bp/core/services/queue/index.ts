import { IO } from 'botpress/sdk'

export interface QueueOptions {
  retries: number
  drainInterval: number
}

export const defaultOptions: QueueOptions = { retries: 2, drainInterval: 2000 }

export type JobWithEvent = {
  event: IO.Event
}

export type Job = JobWithEvent | IO.Event

export interface JobWrapper {
  job: Job
  id: string
  timestamp: Date
  retries: number
}

export type QueueConsummer = ((message: IO.Event) => Promise<void>)

export interface Queue {
  isEmpty(): boolean
  enqueue(job: Job, retries: number, isPriority: boolean): Promise<void>
  dequeue(): Promise<JobWrapper | undefined>
  cancelAll(job: Job): Promise<void>
  peek(job: Job): Promise<JobWrapper | undefined>
  subscribe(fn: QueueConsummer): void
}
