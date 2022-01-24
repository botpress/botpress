import axios from 'axios'
import fse from 'fs-extra'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import { nanoid } from 'nanoid'
import { Socket, io } from 'socket.io-client'

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
   * When this value is defined, the benchmark scenario will start over and increment the number of users by this value.
   * The scenario will be repeated until the speficied SLA is no longer respected
   */
  increments?: number
  /** The base URL of the bot, including the port number, if any */
  url: string
  botId: string
  /**
   * Uses channel-web instead of converse. The initial setup includes setting up a socket connection
   * and sending a "visit" payload to set the user's language (to handle cases where the nlu server is disabled)
   */
  useWeb?: boolean
  /** When enabled, each message sent will be displayed with their response time */
  isVerbose: boolean
  interval: NodeJS.Timeout | undefined
  textMessages: string[]

  maxMpsReached: number = 0

  /**
   * When running benchmark as "incremental", it will keep the same first user Ids when incrementing
   * This prevents converse from creating thousand of users, and is required for channel-web since the "setup" time for new users is expensive
   */
  private userIds: { [index: number]: string } = {}

  private webUserSockets: { [userId: string]: Socket } = {}

  constructor(args) {
    this.url = args.url.replace(/\/+$/, '')
    this.botId = args.botId
    this.slaTarget = args.slaTarget
    this.slaLimit = args.slaLimit
    this.users = args.users
    this.messages = args.messages
    this.increments = args.increments
    this.isVerbose = Boolean(args.verbose)
    this.useWeb = Boolean(args.useWeb)

    this.stats = new Stats(this.slaLimit, this.slaTarget)

    if (args.messageFile && fse.existsSync(args.messageFile)) {
      this.textMessages = fse.readFileSync(args.messageFile, 'utf-8').split('\n')
    } else {
      this.textMessages = [args.text]
    }
  }

  async start() {
    await this.validateBotConfig()

    this.interval = setInterval(this.displayProgress, ms('2s'))

    while (true) {
      this.stats.clear()
      await this.startScenario()

      if (this.increments === undefined) {
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
      if (!this.userIds?.[i]) {
        this.userIds[i] = nanoid()
      }

      promises.push(this.sendMessagesToUser(this.userIds[i]))
    }

    await Promise.all(promises)
    this.displaySummary()
  }

  async sendMessagesToUser(userId: string) {
    for (let i = 0; i < this.messages; i++) {
      if (!this.useWeb) {
        await this.sendMessage(userId, i)
      } else {
        await this.sendWebMessage(userId, i)
      }
    }
  }

  get randomMessage() {
    return {
      type: 'text',
      text: _.sample(this.textMessages)
    }
  }

  async sendMessage(userId: string, index: number) {
    const start = Date.now()
    let status
    try {
      const result = await axios.post(
        `${this.url}/api/v1/bots/${this.botId}/converse/benchmark${userId}`,
        this.randomMessage
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

  getSocketId = async (userId: string): Promise<string> => {
    if (this.webUserSockets[userId]) {
      return this.webUserSockets[userId].id
    }

    const socket = io(`${this.url}/guest`, {
      query: {
        visitorId: userId
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    })

    await Promise.fromCallback(cb => socket.on('connect', () => cb(undefined)))

    this.webUserSockets[userId] = socket

    // Ensure there is at least a language for the user
    await axios.post(`${this.url}/api/v1/bots/${this.botId}/mod/channel-web/messages?__ts=${Date.now()}`, {
      webSessionId: socket.id,
      payload: { type: 'visit', text: 'User visit', timezone: 0, language: 'en' }
    })

    return socket.id
  }

  async sendWebMessage(userId: string, index: number) {
    const socketId = await this.getSocketId(userId)

    const start = Date.now()
    let status

    try {
      const result = await axios.post(`${this.url}/api/v1/bots/${this.botId}/mod/channel-web/messages?__ts=${start}`, {
        webSessionId: socketId,
        payload: this.randomMessage
      })

      await Promise.fromCallback(cb => {
        this.webUserSockets[userId].on('event', ev => {
          if (ev.name === 'guest.webchat.message') {
            cb(undefined)
          }
        })
      })

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
      console.info(`[${moment().format('HH:mm:ss')}] ${message}`)
    } else {
      console.info(message)
    }
  }
}

export default argv => {
  const benchmark = new Bench(argv)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  benchmark.start()
}
