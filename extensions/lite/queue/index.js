import { EventEmitter } from 'events'
import nanoid from 'nanoid'

export default class Queue {
  constructor(name, logger, options = {}) {
    this.name = name
    this.logger = logger
    this.options = Object.assign({ retries: 2, drainInterval: 2000 }, options)
    this.ee = new EventEmitter()
    this.queue = []

    const drainStuckJobs = () => this.queue.length > 0 && this.ee.emit('newJob')
    this.drain = setInterval(drainStuckJobs, this.options.drainInterval)
  }

  enqueue(job, retries = 0, isPriority = false) {
    const jobWrapped = { job, id: nanoid(), timestamp: new Date(), retries }
    if (isPriority) {
      this.queue.unshift(jobWrapped)
    } else {
      this.queue.push(jobWrapped)
    }
    this.ee.emit('newJob')
  }

  dequeue() {
    return this.queue.shift()
  }

  subscribe(fn) {
    this.ee.on('newJob', async () => {
      const { job, retries } = this.dequeue()
      try {
        await fn(job)
      } catch (err) {
        this.logger.error(`${this.name} queue failed to process job: ${err.message}`)

        if (retries + 1 <= this.options.retries) {
          this.enqueue(job, retries + 1, true)
        } else {
          this.logger.warn(
            `[WARNING] Retrying job within ${this.name} queue failed
            ${this.options.retries} times! Dropping it!`
          )
        }
      }
    })
  }
}
