import { IO } from 'botpress/sdk'

export class SessionIdFactory {
  static createIdFromEvent(eventDestination: IO.EventDestination) {
    const { botId, channel, target, threadId } = eventDestination
    return `${channel}::${target}::${botId}${threadId ? `::${threadId}` : ''}`
  }

  static extractDestinationFromId(
    sessionId: string
  ): Pick<IO.EventDestination, 'channel' | 'target' | 'botId' | 'threadId'> {
    const [channel, target, botId, threadId] = sessionId.split('::')
    return { channel, target, botId, threadId }
  }
}
