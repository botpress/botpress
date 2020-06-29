import { IO, PromptNode } from 'botpress/sdk'
import { Event } from 'core/sdk/impl'
import _ from 'lodash'

import { MIN_CONFIDENCE_CANCEL } from './prompt-manager'

export const buildMessage = (messagesByLang: { [lang: string]: string }, text?: string) => {
  return Object.keys(messagesByLang || {}).reduce((acc, lang) => {
    acc[`markdown$${lang}`] = true
    acc[`typing$${lang}`] = true
    acc[`text$${lang}`] = `${messagesByLang[lang]}${text ? `: ${text}` : ''}`
    return acc
  }, {})
}

// TODO backend translations
const getConfirmationQuestion = value => {
  return {
    en: `Is that value correct?: ${value}`,
    fr: `Est-ce que cette valeur est correcte?: ${value}`
  }
}

export const getConfirmPromptNode = (node: PromptNode, value: any): PromptNode => {
  const question = buildMessage(node.confirm || getConfirmationQuestion(value))
  return {
    type: 'confirm',
    output: 'confirmed',
    question,
    params: { question }
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
