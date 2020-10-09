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

// export const getQnaEntryPayloadsLegacy = async (
//   item: Item,
//   event: sdk.IO.IncomingEvent,
//   userLang: string,
//   fallbackLang: string
// ) => {
//   let args: any = {
//     event,
//     user: _.get(event, 'state.user') || {},
//     session: _.get(event, 'state.session') || {},
//     temp: _.get(event, 'state.temp') || {},
//     collectFeedback: true
//   }

//   let lang = userLang ?? fallbackLang
//   if (!item.answers[lang]?.length && !item.contentAnswers?.length) {
//     if (!item.answers[fallbackLang]?.length && !item.contentAnswers?.length) {
//       throw new Error(`No answers found for language ${lang} or default language ${fallbackLang}`)
//     }
//     lang = fallbackLang
//   }

//   let renderer = 'builtin_text'
//   const electedAnswer = getAlternativeAnswer(item, lang)
//   if (electedAnswer?.startsWith('#!')) {
//     renderer = `!${electedAnswer.replace('#!', '')}`
//   } else {
//     args = {
//       ...args,
//       text: electedAnswer,
//       typing: true
//     }
//   }

//   const payloads: sdk.Content.All[] = []

//   if (item.answers?.[lang]?.length > 0) {
//     const textContent: sdk.Content.Text = {
//       text: item.answers[lang][0],
//       type: 'text',
//       variations: item.answers[lang],
//       extraProps: { BOT_URL: (process as any).EXTERNAL_URL },
//       metadata: { __markdown: true, __typing: true, __trimText: 500, collectFeedback: true } // TODO: put these in config?
//     }

//     payloads.push(textContent)
//   }

//   if (!item.contentAnswers) {
//     return payloads
//   }

//   return [...payloads] // TODO: implement contentAnswers
// }
