import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { QnaEntry } from './qna'
import { Item } from './storage'

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

export const getQnaEntryPayloads = async (item: Item, userLang: string, fallbackLang: string) => {
  let lang = userLang ?? fallbackLang
  if (!item.answers[lang] && !item.contentAnswers?.length) {
    if (!item.answers[fallbackLang] && !item.contentAnswers?.length) {
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
      extraProps: { BOT_URL: process.EXTERNAL_URL },
      metadata: { __markdown: true, __typing: true, __trimText: 500 } // TODO: put these in config?
    }

    payloads.push(textContent)
  }

  if (!item.contentAnswers) {
    return payloads
  }

  return [...payloads] // TODO: implement contentAnswers
}
