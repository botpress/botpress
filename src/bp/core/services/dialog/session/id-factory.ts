import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(eventDestination: IO.EventDestination) {
    const { channel, target, threadId } = eventDestination
    return `${channel}::${target}${threadId ? `::${threadId}` : ''}`
  }

  static extractDestinationFromId(sessionId: string): Pick<IO.EventDestination, 'channel' | 'target' | 'threadId'> {
    const [channel, target, threadId] = sessionId.split('::')
    return { channel, target, threadId }
  }
}
