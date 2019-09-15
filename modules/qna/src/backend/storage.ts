import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

import { QnaEntry, QnaItem } from './qna'

export const NLU_PREFIX = '__qna__'
const DEFAULT_CATEGORY = 'global'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

const getIntentId = id => `${NLU_PREFIX}${id}`

const makeID = (qna: QnaEntry) => {
  const firstQuestion = qna.questions[Object.keys(qna.questions)[0]][0]
  return `${safeId()}_${slugify(firstQuestion)
    .replace(/^_+/, '')
    .substring(0, 50)
    .replace(/_+$/, '')}`
}

const normalizeQuestions = questions =>
  questions
    .map(q =>
      q
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

export default class Storage {
  private bp: typeof sdk
  private config
  private botId: string
  private categories: string[]

  constructor(bp: typeof sdk, config, botId) {
    this.bp = bp
    this.config = config
    this.botId = botId

    if (config.qnaCategories && config.qnaCategories.length > 0) {
      this.categories = config.qnaCategories
        .split(',')
        .map(x => x.trim())
        .filter(x => x.length)
    }
  }

  private async getAxiosConfig() {
    return this.bp.http.getAxiosConfigForBot(this.botId, { localUrl: true })
  }

  async initialize() {
    await this.migrate11To12()
    await this.syncQnaToNlu()
  }

  // @Deprecated > 12
  async migrate11To12() {
    const bot = await this.bp.bots.getBotById(this.botId)
    const qnas = await this.fetchQNAs()

    return await Promise.all(
      qnas.map(({ id, data }) => {
        const initial = _.cloneDeep(data)
        const questions = data.questions
        const answers = data.answers
        if (!data.category) {
          data.category = 'global'
        }
        if (_.isArray(questions)) {
          data.questions = {
            [bot.defaultLanguage]: questions
          }
        }
        if (_.isArray(answers)) {
          data.answers = {
            [bot.defaultLanguage]: answers
          }
        }

        if (!_.isEqual(initial, data)) {
          return this.update(data, id)
        }
      })
    )
  }

  /**
   * Creates QNA intents for each QNA item and cleanup unused qna intents.
   */
  async syncQnaToNlu(): Promise<void> {
    const axiosConfig = await this.getAxiosConfig()
    const allQuestions = await this.fetchQNAs()
    const { data: allIntents } = await axios.get(`/mod/nlu/intents`, axiosConfig)

    const leftOverQnaIntents = allIntents.filter(
      intent =>
        intent.name.startsWith('__qna__') && !_.find(allQuestions, q => getIntentId(q.id).toLowerCase() === intent.name)
    )
    await Promise.map(leftOverQnaIntents, intent => axios.delete(`/mod/nlu/intents/${intent.name}`, axiosConfig))

    const qnaItemsToSync = allQuestions.filter(
      qnaItem => qnaItem.data.enabled && !_.find(allIntents, i => i.name === getIntentId(qnaItem.id).toLowerCase())
    )
    await Promise.map(qnaItemsToSync, item => this.createNLUIntentFromQnaItem(item))
  }

  private async createNLUIntentFromQnaItem(qnaItem: QnaItem): Promise<void> {
    const axiosConfig = await this.getAxiosConfig()
    const utterances = {}
    for (const lang in qnaItem.data.questions) {
      utterances[lang] = normalizeQuestions(qnaItem.data.questions[lang])
    }

    const intent = {
      name: getIntentId(qnaItem.id),
      entities: [],
      contexts: [qnaItem.data.category || DEFAULT_CATEGORY],
      utterances: utterances
    }

    await axios.post('/mod/nlu/intents', intent, axiosConfig)
    this.bp.logger.info(`Created NLU intent for QNA ${qnaItem.id}`)
  }

  async update(data: QnaEntry, id: string): Promise<string> {
    await this.checkForDuplicatedQuestions(data, id)

    id = id || makeID(data)
    const item: QnaItem = { id, data }

    if (data.enabled) {
      await this.createNLUIntentFromQnaItem(item)
    } else {
      await this.deleteMatchingIntent(item.id)
    }

    await this.bp.ghost
      .forBot(this.botId)
      .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))

    return id
  }

  async deleteMatchingIntent(id: string) {
    const axiosConfig = await this.getAxiosConfig()
    try {
      await axios.delete(`/mod/nlu/intents/${getIntentId(id)}`, axiosConfig)
    } catch (err) {
      /* swallow error */
    }
  }

  async insert(qna: QnaEntry | QnaEntry[]): Promise<string[]> {
    const ids = await Promise.mapSeries(_.isArray(qna) ? qna : [qna], async (data, i) => {
      const id = makeID(data)
      const item: QnaItem = { id, data }
      if (data.enabled) {
        await this.createNLUIntentFromQnaItem(item)
      }

      await this.bp.ghost
        .forBot(this.botId)
        .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify(item, undefined, 2))

      return id
    })

    return ids
  }

  private async checkForDuplicatedQuestions(newItem: QnaEntry, editingQnaId?: string) {
    const qnaItems = (await this.fetchQNAs()).filter(q => !editingQnaId || q.id != editingQnaId)

    const newQuestions = Object.values(newItem.questions).reduce((a, b) => a.concat(b), [])
    const dupes = _.flatMap(qnaItems, item => Object.values(item.data.questions))
      .reduce((a, b) => a.concat(b), [])
      .filter(q => newQuestions.includes(q))

    if (dupes.length) {
      throw new Error(`These questions already exists in another entry: ${dupes.join(', ')}`)
    }
  }

  /**
   * This will migrate questions to the new format.
   * @deprecated Questions support multiple answers since v11.3
   */
  private migrate_11_2_to_11_3(question) {
    if (!question.data.answers) {
      question.data.answers = [question.data.answer]
    }
    return question
  }

  async getQnaItem(id: string): Promise<QnaItem> {
    const filename = `${id}.json`

    const data = await this.bp.ghost.forBot(this.botId).readFileAsString(this.config.qnaDir, filename)

    return this.migrate_11_2_to_11_3(JSON.parse(data))
  }

  async fetchQNAs(opts?: Paging) {
    try {
      let questions = await this.bp.ghost.forBot(this.botId).directoryListing(this.config.qnaDir, '*.json')
      if (opts && opts.start && opts.count) {
        questions = questions.slice(opts.start, opts.start + opts.count)
      }

      return Promise.map(questions, itemName => this.getQnaItem(itemName.replace('.json', '')))
    } catch (err) {
      this.bp.logger.warn(`Error while reading questions. ${err}`)
      return []
    }
  }

  async filterByCategoryAndQuestion(question: string, categories: string[]) {
    const allQuestions = await this.fetchQNAs()
    const filteredQuestions = allQuestions.filter(q => {
      const { questions, category } = q.data

      const hasMatch =
        Object.values(questions)
          .reduce((a, b) => a.concat(b), [])
          .join('\n')
          .toLowerCase()
          .indexOf(question.toLowerCase()) !== -1

      if (!categories.length) {
        return hasMatch || q.id.includes(question)
      }

      if (!question) {
        return category && categories.indexOf(category) !== -1
      }
      return hasMatch && category && categories.indexOf(category) !== -1
    })

    return filteredQuestions.reverse()
  }

  async getQuestions(
    { question = '', categories = [] },
    { limit = 50, offset = 0 }
  ): Promise<{ items: QnaItem[]; count: number }> {
    let items: QnaItem[] = []
    let count = 0

    if (!(question || categories.length)) {
      items = await this.fetchQNAs({
        start: offset ? parseInt(offset) : undefined,
        count: limit ? parseInt(limit) : undefined
      })
      count = await this.count()
    } else {
      const tmpQuestions = await this.filterByCategoryAndQuestion(question, categories)
      items = tmpQuestions.slice(offset, offset + limit)
      count = tmpQuestions.length
    }
    return { items, count }
  }

  async count() {
    const questions = await this.fetchQNAs()
    return questions.length
  }

  // TODO remove batch deleter, it's done one by one anyway
  async delete(qnaId) {
    const ids = _.isArray(qnaId) ? qnaId : [qnaId]
    if (ids.length === 0) {
      return
    }

    const deletePromise = async (id): Promise<void> => {
      await this.deleteMatchingIntent(id)
      return this.bp.ghost.forBot(this.botId).deleteFile(this.config.qnaDir, `${id}.json`)
    }

    await Promise.all(ids.map(deletePromise))
  }

  getCategories() {
    return this.categories
  }

  hasCategories() {
    return this.categories && this.categories.length > 0
  }
}
