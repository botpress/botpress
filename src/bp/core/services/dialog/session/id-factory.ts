import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(event: IO.Event) {
    return `${event.channel}::${event.target}::${event.threadId}`
  }

  static createTargetFromId(sessionId: string) {
    return sessionId.split('::')[1]
  }
}
