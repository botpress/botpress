import * as sdk from 'botpress/sdk'
import { QnaEntry, QnaItem } from 'common/typings'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { WellKnownFlags } from 'core/dialog'
import { EventEngine } from 'core/events'
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
  private loadedBots: {
    [botId: string]: {
      defaultLang: string
      qnaDisabled: boolean
    }
  } = {}

  constructor(
    @inject(TYPES.EventEngine)
    private eventEngine: EventEngine,
    @inject(TYPES.GhostService)
    private bpfs: GhostService,
    @inject(TYPES.CMSService)
    private cmsService: CMSService,
    @inject(TYPES.BotService)
    private botService: BotService
  ) {}

  initialize() {
    this.eventEngine.register({
      name: 'qna.incoming',
      direction: 'incoming',
      handler: async (event: any, next) => {
        if (!event.hasFlag(WellKnownFlags.SKIP_QNA_PROCESSING)) {
          try {
            const { defaultLang, qnaDisabled } = await this._getBotConfig(event.botId)
            if (defaultLang && !qnaDisabled) {
              await this._processEvent(event, defaultLang)
            }

            next()
          } catch (err) {
            next(err)
          }
        }
      },
      order: 130, // must be after the NLU middleware and before the dialog middleware
      description: 'Listen for predefined questions and send canned responses.'
    })
  }

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

  getIntentActions = async (intentName: string, event: sdk.IO.IncomingEvent): Promise<sdk.NDU.Actions[]> => {
    const actions: any = []

    const { defaultLang } = await this._getBotConfig(event.botId)
    const qnaEntry = await this.getQuestionForIntent(intentName, event.botId)

    if (qnaEntry?.enabled) {
      if (qnaEntry.action.includes('text')) {
        const payloads = await this._getQnaEntryPayloads(qnaEntry, event, TEXT_RENDERER, defaultLang)
        actions.push({ action: 'send', data: { payloads, source: 'qna', sourceDetails: intentName } })
      }

      if (qnaEntry.action.includes('redirect')) {
        actions.push({ action: 'redirect', data: { flow: qnaEntry.redirectFlow, node: qnaEntry.redirectNode } })
      }
    }

    return actions
  }

  private _getBotConfig = async (botId: string) => {
    if (this.loadedBots[botId]) {
      return this.loadedBots[botId]
    } else {
      const botInfo = await this.botService.findBotById(botId)
      if (!botInfo) {
        throw new Error('Unknown bot ID')
      }

      return (this.loadedBots[botId] = {
        defaultLang: botInfo.defaultLanguage,
        qnaDisabled: botInfo.qna?.disabled ?? false
      })
    }
  }

  private _processEvent = async (event: sdk.IO.IncomingEvent, defaultLang: string) => {
    if (!event.nlu || !event.nlu.intents || event.ndu) {
      return
    }

    for (const intent of event.nlu.intents) {
      const qnaEntry = await this.getQuestionForIntent(intent.name, event.botId)
      if (qnaEntry && qnaEntry.enabled) {
        event.suggestions?.push(
          await this._buildSuggestions(event, qnaEntry, intent.confidence, intent.name, defaultLang)
        )
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

  private _buildSuggestions = async (
    event: sdk.IO.IncomingEvent,
    qnaEntry: QnaEntry,
    confidence,
    intent,
    defaultLang
  ): Promise<sdk.IO.Suggestion> => {
    const payloads: any = []

    if (qnaEntry.action.includes('text')) {
      payloads.push(...(await this._getQnaEntryPayloads(qnaEntry, event, TEXT_RENDERER, defaultLang)))
    }

    if (qnaEntry.action.includes('redirect')) {
      payloads.push({ type: 'redirect', flow: qnaEntry.redirectFlow, node: qnaEntry.redirectNode })
    }

    return <sdk.IO.Suggestion>{
      confidence,
      payloads,
      source: 'qna',
      sourceDetails: intent
    }
  }
}
