import { Logger } from 'botpress/sdk'
import { inject, injectable, optional, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid'

import { TYPES } from '../../types'

import { defaultOptions, Job, JobWithEvent, JobWrapper, Queue, QueueOptions } from '.'

@injectable()
export default class MemoryQueue implements Queue {
  private options: QueueOptions
  private queue: Array<JobWrapper> = []
  private subscribers: Array<Function> = []
  private _lock: { [queueId: string]: boolean } = {}
  private _drain: NodeJS.Timer

  constructor(
    public name: string,
    @inject(TYPES.Logger)
    @tagged('name', 'MemoryQueue')
    private logger: Logger,
    @optional() options: Partial<QueueOptions> = {}
  ) {
    this.options = { ...defaultOptions, ...options }
    this._drain = setInterval(this.drain, this.options.drainInterval)
  }

  dispose = () => {
    if (this._drain) {
      clearInterval(this._drain)
    }
  }

  drain = () => {
    if (this.queue.length > 0) {
      this.tick()
    }
  }

  async isEmpty() {
    return !this.queue.length
  }

  getQueueId(job: Job): string {
    const event = (job as JobWithEvent).event || job

    return (
      (_.get(event, 'bot.id') ||
        _.get(event, 'bot.botId') ||
        _.get(event, 'botId') ||
        _.get(event, 'raw.bot.id') ||
        _.get(event, 'raw.botId') ||
        'global') +
      '::' +
      (_.get(event, 'user.id') ||
        _.get(event, 'user.userId') ||
        _.get(event, 'userId') ||
        _.get(event, 'raw.user.id') ||
        _.get(event, 'raw.userId') ||
        _.get(event, 'raw.to') ||
        'default')
    )
  }

  async enqueue(job: Job, retries: number = 0, isPriority: boolean = false) {
    const jobWrapped: JobWrapper = { job, id: nanoid(), timestamp: new Date(), retries }
    if (isPriority) {
      this.queue.unshift(jobWrapped)
    } else {
      this.queue.push(jobWrapped)
    }
    this.tick()
  }

  async dequeue() {
    return this.queue.shift()
  }

  async cancelAll(job: Job) {
    const jobQueueId = this.getQueueId(job)
    this.queue = this.queue.filter(item => this.getQueueId(item.job) !== jobQueueId)
  }

  async peek(job: Job) {
    const jobQueueId = this.getQueueId(job)
    return this.queue.find(item => this.getQueueId(item.job) === jobQueueId)
  }

  async tick() {
    const toDequeueIdx = this.queue.findIndex(el => !this._lock[this.getQueueId(el.job)])

    if (toDequeueIdx === -1) {
      return
    }

    const [{ job, retries }] = this.queue.splice(toDequeueIdx, 1)
    const queueId = this.getQueueId(job)
    this._lock[queueId] = true

    try {
      await Promise.mapSeries(this.subscribers, fn => fn(job))
    } catch (err) {
      this.logger.warn(`${this.name} queue failed to process job: ${err.message}`)

      if (retries + 1 <= this.options.retries) {
        this.enqueue(job, retries + 1, true)
      } else {
        this.logger.error(
          `Retrying job within ${this.name} queue failed ${this.options.retries} times. Abandoning the job.`
        )
      }
    } finally {
      delete this._lock[queueId]
      if (this.queue.length) {
        this.tick()
      }
    }
  }

  subscribe(fn: Function) {
    this.subscribers.push(fn)
  }
}
