import { Config, StudioConnector } from '../typings'

export default class BpSocket {
  private events: any
  private userIdScope: string
  private chatId: string | undefined

  public onClear: (event: any) => void
  public onMessage: (event: any) => void
  public onTyping: (event: any) => void
  public onData: (event: any) => void

  constructor(bp: StudioConnector, config: Config) {
    this.events = bp?.events
    this.userIdScope = config.userIdScope
    this.chatId = config.chatId
  }

  public setup(userId?: string) {
    if (!this.events) {
      return
    }

    // Requires userId to be long enough so it can't be guessed
    if (userId?.length >= 24) {
      this.events.updateVisitorId(userId, this.userIdScope)
    }

    // Connect the Botpress Web Socket to the server
    this.events.setup(this.userIdScope)

    this.events.on('guest.webchat.clear', this.onClear)
    this.events.on('guest.webchat.message', this.onMessage)
    this.events.on('guest.webchat.typing', this.onTyping)
    this.events.on('guest.webchat.data', this.onData)

    // firehose events to parent page
    this.events.onAny(this.postToParent)
  }

  public postToParent = (_type: string, payload: any) => {
    // we could filter on event type if necessary
    window.parent?.postMessage({ ...payload, chatId: this.chatId }, '*')
  }

  public newUserId() {
    this.events.deleteVisitorId(this.userIdScope)

    this.setup()
  }

  /** Waits until the VISITOR ID and VISITOR SOCKET ID is set  */
  public async waitForUserId(): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (isString(window.__BP_VISITOR_ID) && isString(window.__BP_VISITOR_SOCKET_ID)) {
          clearInterval(interval)

          const userId = window.__BP_VISITOR_ID
          this.postToParent('', { userId })

          resolve()
        }
      }, 250)

      setTimeout(() => {
        clearInterval(interval)
        reject('Timeout to acquire VISITOR ID and VISITOR SOCKET ID exceeded.')
      }, 30000)
    })
  }
}

const isString = (str: string | any): str is string => {
  return typeof str === 'string' && str !== 'undefined'
}
