import { QnaEntry, QnaItem } from '@botpress/typings/qna'
import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

const NLU_PREFIX = '__qna__'
const TEXT_RENDERER = '#builtin_text'

const getAlternativeAnswer = (qnaEntry: QnaEntry, lang: string): string => {
  const randomIndex = Math.floor(Math.random() * qnaEntry.answers[lang].length)
  return qnaEntry.answers[lang][randomIndex]
}

@injectable()
export class QnaService {
  constructor(
    @inject(TYPES.GhostService)
    private bpfs: GhostService,
    @inject(TYPES.CMSService)
    private cmsService: CMSService
  ) {}

  getQuestionForIntent = async (intentName: string, botId: string) => {
    if (intentName && intentName.startsWith(NLU_PREFIX)) {
      const qnaId = intentName.substring(NLU_PREFIX.length)
      return (await this.getQuestion(qnaId, botId)).data
    }
  }

  getQuestion = async (id: string, botId: string): Promise<QnaItem> => {
    return this.bpfs.forBot(botId).readFileAsObject<QnaItem>('./qna', id.endsWith('.json') ? id : `${id}.json`)
  }

  getQuestions = async (
    botId: string,
    { question = '', filteredContexts = [], limit = 50, offset = 0 }
  ): Promise<{ items: QnaItem[]; count: number }> => {
    if (!(question || filteredContexts.length)) {
      return {
        items: await this._fetchQuestions(botId, { start: offset, count: limit }),
        count: await this._totalQuestionsCount(botId)
      }
    } else {
      const items = await this._filterByContextsAndQuestion(botId, question, filteredContexts)
      return {
        items: items.slice(offset, offset + limit),
        count: items.length
      }
    }
  }

  private _getQuestionsList = async (botId: string): Promise<string[]> => {
    return this.bpfs.forBot(botId).directoryListing('./qna', '*.json')
  }

  private _fetchQuestions = async (botId: string, opts?: sdk.Paging) => {
    let questions = await this._getQuestionsList(botId)
    if (opts?.count) {
      questions = questions.slice(opts.start, opts.start + opts.count)
    }

    return Promise.map(questions, itemName => this.getQuestion(itemName, botId))
  }

  private _totalQuestionsCount = async (botId: string): Promise<number> => {
    return (await this._getQuestionsList(botId)).length
  }

  private _filterByContextsAndQuestion = async (botId, question: string, filteredContexts: string[]) => {
    const allQuestions = await this._fetchQuestions(botId)
    const filteredQuestions = allQuestions.filter(q => {
      const { questions, contexts } = q.data

      const hasMatch =
        Object.values(questions)
          .reduce((a, b) => a.concat(b), [])
          .join('\n')
          .toLowerCase()
          .indexOf(question.toLowerCase()) !== -1

      if (!filteredContexts.length) {
        return hasMatch || q.id.includes(question)
      }

      if (!question) {
        return !!_.intersection(contexts, filteredContexts).length
      }
      return hasMatch && !!_.intersection(contexts, filteredContexts).length
    })

    return filteredQuestions.reverse()
  }

  private _getQnaEntryPayloads = async (
    qnaEntry: QnaEntry,
    event: sdk.IO.IncomingEvent,
    renderer: string,
    defaultLang: string
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
        typing: true,
        markdown: true
      }
    }

    return this.cmsService.renderElement(renderer, args, {
      botId: event.botId,
      channel: event.channel,
      target: event.target,
      threadId: event.threadId
    })
  }
}
