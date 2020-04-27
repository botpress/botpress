import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { QnaEntry } from './qna'
import Storage, { NLU_PREFIX } from './storage'

export const getQuestionForIntent = async (storage: Storage, intentName) => {
  if (intentName && intentName.startsWith(NLU_PREFIX)) {
    const qnaId = intentName.substring(NLU_PREFIX.length)
    return (await storage.getQnaItem(qnaId)).data
  }
}

export const getAlternativeAnswer = (qnaEntry: QnaEntry, lang: string): string => {
  const randomIndex = Math.floor(Math.random() * qnaEntry.answers[lang].length)
  return qnaEntry.answers[lang][randomIndex]
}

export const getQnaEntryPayloads = async (
  qnaEntry: QnaEntry,
  event: sdk.IO.IncomingEvent,
  renderer: string,
  defaultLang: string,
  bp: typeof sdk
) => {
  let lang = event.nlu.language
  if (lang === 'n/a') {
    lang = defaultLang
  }

  let args: any = {
    user: _.get(event, 'state.user') || {},
    session: _.get(event, 'state.session') || {},
    temp: _.get(event, 'state.temp') || {},
    collectFeedback: true
  }

  if (!qnaEntry.answers[lang]) {
    if (!qnaEntry.answers[defaultLang]) {
      throw new Error(`No answers found for language ${lang} or default language ${defaultLang}`)
    }

    lang = defaultLang
  }

  const electedAnswer = getAlternativeAnswer(qnaEntry, lang)
  if (electedAnswer.startsWith('#!')) {
    renderer = `!${electedAnswer.replace('#!', '')}`
  } else {
    args = {
      ...args,
      text: electedAnswer,
      typing: true
    }
  }

  return bp.cms.renderElement(renderer, args, {
    botId: event.botId,
    channel: event.channel,
    target: event.target,
    threadId: event.threadId
  })
}

export const getIntentActions = async (
  intentName: string,
  event: sdk.IO.IncomingEvent,
  { bp, storage, config, defaultLang }
): Promise<sdk.NDU.Actions[]> => {
  const actions = []

  const qnaEntry = await getQuestionForIntent(storage, intentName)

  if (qnaEntry?.enabled) {
    if (qnaEntry.action.includes('text')) {
      const payloads = await getQnaEntryPayloads(qnaEntry, event, config.textRenderer, defaultLang, bp)
      actions.push({ action: 'send', data: { payloads, source: 'qna', sourceDetails: intentName } })
    }

    if (qnaEntry.action.includes('redirect')) {
      actions.push({ action: 'redirect', data: { flow: qnaEntry.redirectFlow, node: qnaEntry.redirectNode } })
    }
  }

  return actions
}
