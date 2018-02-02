import nanoid from 'nanoid'
import Promise from 'bluebird'
import _ from 'lodash'

export default class Queue {
  constructor(name, logger, options = {}) {
    this.name = name
    this.logger = logger
    this.options = Object.assign({ retries: 2, drainInterval: 2000 }, options)
    this.queue = []
    this.subscribers = []
    this._lock = {}

    this._drain = setInterval(this.drain, this.options.drainInterval)
  }

  drain = () => {
    this.queue.length > 0 && this.tick()
  }

  getQueueId(job) {
    const event = job.event || job

    return (
      _.get(event, 'user.id') ||
      _.get(event, 'user.userId') ||
      _.get(event, 'userId') ||
      _.get(event, 'raw.user.id') ||
      _.get(event, 'raw.userId') ||
      'default'
    )
  }

  enqueue(job, retries = 0, isPriority = false) {
    const jobWrapped = { job, id: nanoid(), timestamp: new Date(), retries }
    if (isPriority) {
      this.queue.unshift(jobWrapped)
    } else {
      this.queue.push(jobWrapped)
    }
    this.tick()
  }

  dequeue() {
    return this.queue.shift()
  }

  async tick() {
    const toDequeueIdx = _.findIndex(this.queue, el => {
      const queueId = this.getQueueId(el.job)
      return !this._lock[queueId]
    })

    if (toDequeueIdx === -1) {
      return
    }

    const [{ job, retries }] = _.pullAt(this.queue, [toDequeueIdx])
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

  subscribe(fn) {
    this.subscribers.push(fn)
  }
}
