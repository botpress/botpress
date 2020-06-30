import { IO, PromptNode } from 'botpress/sdk'
import { createMultiLangObject } from 'common/prompts'
import { Event } from 'core/sdk/impl'
import _ from 'lodash'

import { MIN_CONFIDENCE_CANCEL } from './prompt-manager'

// TODO backend translations

export const getConfirmPromptNode = (node: PromptNode, value: any): PromptNode => {
  const output = node.params

  const defaultConfirmation = {
    en: `Is that value correct?: $${output}`,
    fr: `Est-ce que cette valeur est correcte?: $${output}`
  }

  const question = node.params?.confirm || defaultConfirmation

  return {
    type: 'confirm',
    params: {
      output: 'confirmed',
      question: _.mapValues(question, q => q.replace(`$${output}`, value))
    }
  }
}

export const isPromptEvent = (event: IO.IncomingEvent): boolean => {
  return !!(event.prompt || event.state?.session?.prompt || (event.type === 'prompt' && event.direction === 'incoming'))
}

export const shouldCancelPrompt = (event: IO.IncomingEvent): boolean => {
  const confidence = _.chain(event.ndu!.triggers)
    .values()
    .filter(val => val.trigger.name?.startsWith('prompt_cancel'))
    .map((x: any) => x.result[Object.keys(x.result)[0]])
    .first()
    .value()

  return confidence !== undefined && confidence > MIN_CONFIDENCE_CANCEL
}

export const makePromptOutgoingEvent = (incomingEvent: IO.IncomingEvent, node: PromptNode): IO.OutgoingEvent => {
  return Event({
    ..._.pick(incomingEvent, ['botId', 'channel', 'target', 'threadId']),
    direction: 'outgoing',
    type: 'prompt',
    payload: node,
    incomingEventId: incomingEvent.id
  })
}
