import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(eventDestination: IO.EventDestination) {
    const { channel, target, threadId } = eventDestination
    return `${channel}::${target}${threadId ? `::${threadId}` : ''}`
  }

  static createChannelFromId(sessionId: string) {
    return sessionId.split('::')[0]
  }

  static createTargetFromId(sessionId: string) {
    return sessionId.split('::')[1]
  }

  static createThreadIdFromId(sessionId: string) {
    return sessionId.split('::')[2]
  }
}
