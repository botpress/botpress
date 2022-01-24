import { IO, Logger } from 'botpress/sdk'
import { getErrorMessage } from 'common/utils'
import { inject, injectable, optional, tagged } from 'inversify'
import _ from 'lodash'
import { nanoid } from 'nanoid'

import { TYPES } from '../../types'
import { defaultOptions, JobWrapper, Queue, QueueConsumer, QueueOptions } from '.'

@injectable()
export class MemoryQueue<E extends IO.Event> implements Queue<E> {
  private _options: QueueOptions
  private _queue: JobWrapper<E>[] = []
  private _subscribers: Function[] = []
  private _lock: { [queueId: string]: boolean } = {}
  private _drain: NodeJS.Timer
  private _waiters: { [queueId: string]: () => void } = {}

  constructor(
    public name: string,
    @inject(TYPES.Logger)
    @tagged('name', 'MemoryQueue')
    private logger: Logger,
    @optional() options: Partial<QueueOptions> = {}
  ) {
    this._options = { ...defaultOptions, ...options }
    this._drain = setInterval(this.drain, this._options.drainInterval)
  }

  get length() {
    return this._queue.length
  }

  dispose = () => {
    if (this._drain) {
      clearInterval(this._drain)
    }
  }

  drain = () => {
    if (this._queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.tick()
    }
  }

  isEmpty() {
    return !this._queue.length
  }

  isEmptyForJob(job: E) {
    const jobQueueId = this.getQueueId(job)
    const subqueueLength = this._queue.filter(item => this.getQueueId(item.job) === jobQueueId).length
    return !subqueueLength
  }

  isQueueLockedForJob(job: E) {
    return this._lock[this.getQueueId(job)]
  }

  async waitEmpty(job: E) {
    if (this.isEmptyForJob(job) && !this.isQueueLockedForJob(job)) {
      return
    }

    const queueId = this.getQueueId(job)

    return new Promise<void>((resolve, reject) => {
      this._waiters[queueId] = resolve
    })
  }

  getQueueId(job: E): string {
    const event = job
    return `${event.botId}::${event.channel}::${event.target}`
  }

  async enqueue(job: E, retries: number = 0, isPriority: boolean = false) {
    const jobWrapped: JobWrapper<E> = { job, id: nanoid(), timestamp: new Date(), retries }
    if (isPriority) {
      this._queue.unshift(jobWrapped)
    } else {
      this._queue.push(jobWrapped)
    }
    setImmediate(() => this.tick())
  }

  async dequeue() {
    const job = this._queue.shift()
    if (job) {
      this.checkEmptyQueue(job.job)
    }
    return job
  }

  async cancelAll(job: E) {
    const jobQueueId = this.getQueueId(job)
    this._queue = this._queue.filter(item => this.getQueueId(item.job) !== jobQueueId)
    this.checkEmptyQueue(job)
  }

  async peek(job: E) {
    const jobQueueId = this.getQueueId(job)
    return this._queue.find(item => this.getQueueId(item.job) === jobQueueId)
  }

  async tick() {
    const toDequeueIdx = this._queue.findIndex(el => !this._lock[this.getQueueId(el.job)])

    if (toDequeueIdx === -1) {
      return
    }

    const [{ job, retries }] = this._queue.splice(toDequeueIdx, 1)
    const queueId = this.getQueueId(job)
    this._lock[queueId] = true

    try {
      await Promise.mapSeries(this._subscribers, fn => fn(job))
    } catch (err) {
      this.logger.attachError(err).warn(`${this.name} queue failed to process job: ${getErrorMessage(err)}`)

      if (retries + 1 <= this._options.retries) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.enqueue(job, retries + 1, true)
      } else {
        this.logger.error(
          `Retrying job within ${this.name} queue failed ${this._options.retries} times. Abandoning the job.`
        )
      }
    } finally {
      delete this._lock[queueId]
      this.checkEmptyQueue(job)

      if (this._queue.length) {
        setImmediate(() => this.tick())
      }
    }
  }

  private checkEmptyQueue(job: E) {
    const queueId = this.getQueueId(job)

    if (!this._waiters[queueId]) {
      return
    }

    if (this.isEmptyForJob(job) && !this.isQueueLockedForJob(job)) {
      this._waiters[queueId]()
      delete this._waiters[queueId]
    }
  }

  subscribe(fn: QueueConsumer<E>) {
    this._subscribers.push(fn)
  }
}
