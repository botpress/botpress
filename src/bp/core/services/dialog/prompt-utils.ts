import { IO, PromptNode } from 'botpress/sdk'
import lang from 'common/lang'
import { Event } from 'core/sdk/impl'
import _ from 'lodash'

import { MIN_CONFIDENCE_CANCEL } from './prompt-manager'

export const getConfirmPromptQuestion = (messages: { [lang: string]: string }, value: any) => {
  let question = lang.tr('module.builtin.prompt.confirmValue', { value })

  if (messages) {
    question = _.mapValues(messages, (q, lang) => (q.length > 0 ? q.replace(`$value`, value) : question[lang]))
  }

  return question
}

export const isPromptEvent = (event: IO.IncomingEvent): boolean => {
  return !!event.state.context.activePromptStatus || (event.type === 'prompt' && event.direction === 'incoming')
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
