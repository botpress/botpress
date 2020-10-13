import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Item } from './qna'

export const getAlternativeAnswer = (qnaEntry: Item, lang: string): string => {
  const randomIndex = Math.floor(Math.random() * qnaEntry.answers[lang].length)
  return qnaEntry.answers[lang][randomIndex]
}

export const getQnaEntryPayloadsLegacy = async (
  qnaEntry: Item,
  event: sdk.IO.IncomingEvent,
  renderer: string,
  defaultLang: string,
  bp: typeof sdk
) => {
  let args: any = {
    event,
    user: _.get(event, 'state.user') || {},
    session: _.get(event, 'state.session') || {},
    temp: _.get(event, 'state.temp') || {},
    collectFeedback: true
  }

  let lang = event.state?.user?.language ?? defaultLang
  if (!qnaEntry.answers[lang]) {
    if (!qnaEntry.answers[defaultLang]) {
      throw new Error(`No answers found for language ${lang} or default language ${defaultLang}`)
    }

    lang = defaultLang
  }

  const electedAnswer = getAlternativeAnswer(qnaEntry, lang)
  if (electedAnswer?.startsWith('#!')) {
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
