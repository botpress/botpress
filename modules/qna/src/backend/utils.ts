import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'
import path from 'path'

import { Intent, Item } from './qna'

const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

export const QNA_MIN_QUESTIONS = 3
export const QNA_MIN_ANSWERS = 1
export const INTENT_FILENAME = 'qna.intents.json'
export const FLOW_FOLDER = 'flows'

export const toQnaFile = topicName => path.join(topicName, INTENT_FILENAME)
export const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)
export const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

export const makeId = (item: Item) => {
  const firstQuestion = item.questions[Object.keys(item.questions)[0]][0]
  return `__qna__${safeId()}_${slugify(firstQuestion)
    .replace(/^_+/, '')
    .substring(0, 50)
    .replace(/_+$/, '')}`
}

export const normalizeQuestions = (questions: string[]) =>
  questions
    .map(q =>
      q
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

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
