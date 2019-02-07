import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'

import { Stats } from './stats'

class Bench {
  stats: Stats
  /** The default payload that each users will send */
  defaultMessage: any
  /** The target percentage of messages which must be under the limit sla */
  slaTarget: number = 100
  /** Messages taking more than this time are not meeting the desired SLA */
  slaLimit: number = 1500
  /** Number of users sending a message simultaneously */
  users: number = 10
  /** Number of messages that each users will send, one after another */
  messages: number = 5
  /**
   * When this value is greater than 0, the benchmark scenario will start over and increment the number of users by this value.
   * The scenario will be repeated until the speficied SLA is no longer respected
   */
  increments: number = 0
  /** The base URL of the bot, including the port number, if any */
  url: string
  botId: string
  /** When enabled, each message sent will be displayed with their response time */
  isVerbose: boolean
  interval: NodeJS.Timeout | undefined

  maxMpsReached: number = 0

  constructor(args) {
    this.url = args.url
    this.botId = args.botId
    this.slaTarget = args.slaTarget
    this.slaLimit = args.slaLimit
    this.users = args.users
    this.messages = args.messages
    this.increments = args.increments
    this.isVerbose = Boolean(args.verbose)

    this.stats = new Stats(this.slaLimit, this.slaTarget)
    this.defaultMessage = {
      type: 'text',
      text: args.text
    }
  }

  async start() {
    await this.validateBotConfig()

    this.interval = setInterval(this.displayProgress, ms('2s'))

    while (true) {
      this.stats.clear()
      await this.startScenario()

      if (!this.increments) {
        break
      }

      if (this.stats.isSlaBreached()) {
        this.log(`SLA breached. Stopping tests. Max MPS reached: ${this.maxMpsReached}`)
        break
      }

      this.users += this.increments
    }

    clearInterval(this.interval)
  }

  async validateBotConfig() {
    try {
      await axios.get(`${this.url}/studio/${this.botId}/env.js`)
    } catch (err) {
      this.log(`
      Couldn't reach your bot at ${this.url}/studio/${this.botId}/
      Please check your configuration and make sure your bot is running.

      You can use ./bp bench --url and --botId to configure the path.
      `)

      process.exit()
    }
  }

  async startScenario() {
    this.log(`  Scenario: ${this.users} users sending ${this.messages} messages each`)
    this.log(`  Configured SLA: ${this.slaTarget}% of requests must be under ${this.slaLimit}ms`)
    this.log(' ')

    const promises: Promise<any>[] = []
    for (let i = 0; i < this.users; i++) {
      const userId = nanoid()
      promises.push(this.sendMessagesToUser(userId))
    }

    await Promise.all(promises)
    this.displaySummary()
  }

  async sendMessagesToUser(userId) {
    for (let i = 0; i < this.messages; i++) {
      await this.sendMessage(userId, i)
    }
  }

  async sendMessage(userId, index) {
    const start = Date.now()
    let status
    try {
      const result = await axios.post(
        `${this.url}/api/v1/bots/${this.botId}/converse/benchmark${userId}`,
        this.defaultMessage
      )
      status = result.status
    } catch (err) {
      const stack = _.get(err, 'response.data.stack', '')
      status = stack.includes('Request timed out') ? 'Timeout' : err.code
    }

    const elapsed = Date.now() - start
    this.stats.logSentMessage(status, elapsed)

    if (this.isVerbose) {
      this.log(`${userId} - Message #${index} - ${elapsed}ms, status: ${status}`, true)
    }
  }

  displayProgress = () => {
    const messages = this.stats.messagesCount
    const average = this.stats.getAverageLatency()
    if (messages > 0) {
      this.log(`Messages Sent: ${messages}, Avg: ${average}ms`, true)
    }
  }

  displaySummary = () => {
    const { overSlaCount, minLatency, maxLatency } = this.stats
    const slaDetails = `${overSlaCount} messages were over configured SLA (${this.stats.getPctOverSla()}%)`
    const avgMps = this.stats.calculateMps()

    if (avgMps > this.maxMpsReached) {
      this.maxMpsReached = avgMps
    }

    const summary = `
  Messages Sent: ${this.stats.messagesCount} in ${this.stats.getElapsedSeconds()}s
  Average MPS: ${avgMps}
  SLA Breached: ${this.stats.isSlaBreached()}. ${overSlaCount > 0 ? slaDetails : ''}

  Request Latency:
    min: ${minLatency} ms
    avg: ${this.stats.getAverageLatency()} ms
    max: ${maxLatency} ms

  Codes:
    ${this.stats.getCodesSummary()}`

    this.log(summary)
  }

  log = (message, showTimestamp = false) => {
    if (showTimestamp) {
      console.log(`[${moment().format('HH:mm:ss')}] ${message}`)
    } else {
      console.log(message)
    }
  }
}

export default argv => {
  const benchmark = new Bench(argv)
  benchmark.start()
}
