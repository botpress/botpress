import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const convertLastMessages = (lastMessages: sdk.IO.DialogTurnHistory[], eventId: string) => {
  if (!lastMessages) {
    return
  }
  const lastConversation = eventId ? lastMessages.filter(x => x.eventId === eventId) : lastMessages

  if (!lastConversation.length) {
    return
  }

  return {
    userMessage: lastConversation[0].incomingPreview,
    botReplies: lastConversation.map(x => {
      return {
        botResponse: x.replyPreview === undefined ? null : x.replyPreview,
        replySource: x.replySource
      }
    })
  }
}

export const buildScenarioFromEvents = (storedEvents: sdk.IO.StoredEvent[]) => {
  const scenario = {
    steps: [],
    // Since we don't have the real initial state (beforeIncomingMiddleware), we force a new one
    initialState: {},
    finalState: (_.last(storedEvents).event as sdk.IO.IncomingEvent).state
  }

  for (const storedEvent of storedEvents) {
    const incoming = storedEvent.event as sdk.IO.IncomingEvent

    const interactions = convertLastMessages(incoming.state.session.lastMessages, storedEvent.incomingEventId)
    if (interactions) {
      scenario.steps.push(interactions)
    }
  }

  return _.omit(scenario, [
    'initialState.session.lastMessages',
    'initialState.context.jumpPoints',
    'initialState.context.queue',
    'finalState.session.lastMessages',
    'finalState.context.jumpPoints',
    'finalState.context.queue'
  ])
}

export const getMappingFromVisitor = async (
  bp: typeof sdk,
  botId: string,
  visitorId: string
): Promise<string | undefined> => {
  try {
    const rows = await bp.database('web_user_map').where({ botId, visitorId })

    if (rows?.length) {
      const mapping = rows[0]

      return mapping.userId
    }
  } catch (err) {
    bp.logger.error('An error occurred while fetching a visitor mapping.', err)

    return undefined
  }
}
