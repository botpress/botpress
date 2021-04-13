import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(eventDestination: IO.EventDestination) {
    const { botId, channel, target, threadId } = eventDestination
    return `${botId}::${channel}::${target}${threadId ? `::${threadId}` : ''}`
  }

  static extractDestinationFromId(
    sessionId: string
  ): Pick<IO.EventDestination, 'botId' | 'channel' | 'target' | 'threadId'> {
    const [botId, channel, target, threadId] = sessionId.split('::')
    return { botId, channel, target, threadId }
  }
}
