import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(eventDestination: IO.EventDestination) {
    const { channel, target, threadId } = eventDestination
    return `${channel}::${target}::${threadId}`
  }

  static createTargetFromId(sessionId: string) {
    return sessionId.split('::')[1]
  }
}
