import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const convertLastMessages = (lastMessages, eventId) => {
  if (!lastMessages) {
    return
  }
  const lastConvo = eventId ? lastMessages.filter(x => x.eventId === eventId) : lastMessages

  if (!lastConvo.length) {
    return
  }

  return {
    userMessage: lastConvo[0].incomingPreview,
    botReplies: lastConvo.map(x => {
      return {
        // tslint:disable-next-line:no-null-keyword
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
