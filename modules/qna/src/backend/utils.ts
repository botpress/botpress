import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Item } from './qna'

export const QNA_MIN_QUESTIONS = 3
export const QNA_MIN_ANSWERS = 1

export const isQnaComplete = (qnaEntry: Item, lang: string): boolean => {
  return qnaEntry.questions[lang]?.length >= QNA_MIN_QUESTIONS && qnaEntry.answers[lang]?.length >= QNA_MIN_ANSWERS
}

export const getQnaEntryPayloads = async (item: Item, userLang: string, fallbackLang: string) => {
  let lang = userLang ?? fallbackLang
  if (!item.answers[lang]?.length && !item.contentAnswers?.length) {
    if (!item.answers[fallbackLang]?.length && !item.contentAnswers?.length) {
      throw new Error(`No answers found for language ${lang} or default language ${fallbackLang}`)
    }
    lang = fallbackLang
  }

  const payloads: sdk.Content.All[] = []

  if (item.answers?.[lang]?.length > 0) {
    const textContent: sdk.Content.Text = {
      text: item.answers[lang][0],
      type: 'text',
      variations: item.answers[lang],
      extraProps: { BOT_URL: (process as any).EXTERNAL_URL },
      metadata: { __markdown: true, __typing: true, __trimText: 500 } // TODO: put these in config?
    }

    payloads.push(textContent)
  }

  if (!item.contentAnswers) {
    return payloads
  }

  return [...payloads] // TODO: implement contentAnswers
}
