import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { QnaEntry } from './qna'
import Storage, { NLU_PREFIX } from './storage'

export const QNA_MIN_QUESTIONS = 3
export const QNA_MIN_ANSWERS = 1

export const isQnaComplete = (qnaEntry: QnaEntry, lang: string): boolean => {
  return (
    qnaEntry.questions[lang]?.length >= QNA_MIN_QUESTIONS &&
    (qnaEntry.answers[lang]?.length >= QNA_MIN_ANSWERS ||
      qnaEntry.redirectFlow !== undefined ||
      qnaEntry.redirectNode !== undefined)
  )
}

export const getQuestionForIntent = async (storage: Storage, intentName) => {
  if (intentName && intentName.startsWith(NLU_PREFIX)) {
    const qnaId = intentName.substring(NLU_PREFIX.length)
    return (await storage.getQnaItem(qnaId)).data
  }
}

export const getRandomAnswer = (answers: string[]): string => {
  const randomIndex = Math.floor(Math.random() * answers.length)
  return answers[randomIndex]
}

export const getQnaEntryPayloads = async (
  qnaEntry: QnaEntry,
  event: sdk.IO.IncomingEvent,
  renderer: string,
  defaultLang: string,
  bp: typeof sdk
) => {
  let lang = event.state?.user?.language ?? defaultLang
  if (!qnaEntry.answers[lang] && !qnaEntry.contentAnswers) {
    if (!qnaEntry.answers[defaultLang] && !qnaEntry.contentAnswers) {
      throw new Error(`No answers found for language ${lang} or default language ${defaultLang}`)
    }
    lang = defaultLang
  }

  const payloads: object[] = []
  const args: any = {
    event,
    user: _.get(event, 'state.user') || {},
    session: _.get(event, 'state.session') || {},
    temp: _.get(event, 'state.temp') || {},
    collectFeedback: true
  }

  if (qnaEntry.answers?.[lang]?.length > 0) {
    const electedAnswer = getRandomAnswer(qnaEntry.answers[lang])
    const textArgs = { ...args }

    if (electedAnswer.startsWith('#!')) {
      renderer = `!${electedAnswer.replace('#!', '')}`
    } else {
      textArgs.text = electedAnswer
      textArgs.typing = true
    }

    payloads.push(
      ...(await bp.cms.renderElement(renderer, textArgs, {
        botId: event.botId,
        channel: event.channel,
        target: event.target,
        threadId: event.threadId
      }))
    )
  }

  if (!qnaEntry.contentAnswers) {
    return payloads
  }

  for (const contentAnswer of qnaEntry.contentAnswers) {
    renderer = `#${contentAnswer.contentType}`
    const contentArgs = {
      ...args,
      ...contentAnswer,
      typing: payloads.length === 0
    }

    payloads.push(
      ...(await bp.cms.renderElement(renderer, contentArgs, {
        botId: event.botId,
        channel: event.channel,
        target: event.target,
        threadId: event.threadId
      }))
    )
  }

  return payloads
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
