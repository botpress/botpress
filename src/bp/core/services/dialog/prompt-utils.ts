import { IO, PromptNode } from 'botpress/sdk'
import lang from 'common/lang'
import { Event } from 'core/sdk/impl'
import _ from 'lodash'

import { MIN_CONFIDENCE_CANCEL } from './prompt-manager'

export const getConfirmPromptNode = (node: PromptNode, value: any): PromptNode => {
  let question = lang.tr('module.builtin.prompt.confirmValue', { value })

  if (node.params?.confirm) {
    question = _.mapValues(node.params?.confirm, (q, lang) =>
      q.length > 0 ? q.replace(`$value`, value) : question[lang]
    )
  }

  return {
    type: 'confirm',
    params: {
      output: 'confirmed',
      question
    }
  }
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
