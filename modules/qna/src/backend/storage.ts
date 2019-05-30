import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

import { QnaEntry, QnaItem } from './qna'

// TODO fix reply,  answer is probably no good
// TODO fuck batch insert its done one by one anyway
// TODO fuck batch delete its done one by one anyway
// TODO fix dupe check

export const NLU_PREFIX = '__qna__'
const DEFAULT_CATEGORY = 'global'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

const getIntentId = id => `${NLU_PREFIX}${id}`

const getQuestionId = (qna: QnaEntry) => {
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
    const qnas = await this.fetchAllQuestions()

    return await Promise.all(
      qnas.map(({ id, data }) => {
        let hasChanged = false
        const questions = data.questions
        const answers = data.answers
        if (_.isArray(questions)) {
          hasChanged = true
          data.questions = {
            [bot.defaultLanguage]: questions
          }
        }
        if (_.isArray(answers)) {
          hasChanged = true
          data.answers = {
            [bot.defaultLanguage]: answers
          }
        }

        if (hasChanged) {
          return this.update(data, id)
        }
      })
    )
  }

  // TODO Find better way to implement. When manually copying QNA, intents are not created.
  // Manual edit & save of each one is required for the intent to be created.
  async syncQnaToNlu() {
    const axiosConfig = await this.getAxiosConfig()
    const allQuestions = await this.fetchAllQuestions()
    const { data: allIntents } = await axios.get(`/mod/nlu/intents`, axiosConfig)

    const qnaItemsToSync = allQuestions.filter(
      qnaItem => qnaItem.data.enabled && !_.find(allIntents, i => i.name === getIntentId(qnaItem.id).toLowerCase())
    )

    return await Promise.mapSeries(qnaItemsToSync, item => this.createNLUIntentFromQnaItem(item))
  }

  async createNLUIntentFromQnaItem(qnaItem: QnaItem): Promise<void> {
    // TODO check for dupes here !!!!!!!
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
    id = id || getQuestionId(data)
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

  // TODO fuck batch insert its done one by one anyway
  async insert(qna: QnaEntry | QnaEntry[]): Promise<string[]> {
    const ids = await Promise.mapSeries(_.isArray(qna) ? qna : [qna], async (data, i) => {
      const id = getQuestionId(data)
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

  private async checkForDuplicatedQuestions(newQuestions, editingQnaId?) {
    let allQuestions = await this.fetchAllQuestions()

    if (editingQnaId) {
      // when updating, we remove the question from the check
      allQuestions = allQuestions.filter(q => q.id !== editingQnaId)
    }

    const questionsList = _.flatMap(allQuestions, entry => entry.data.questions)
    const dupes = _.uniq(_.filter(questionsList, question => newQuestions.includes(question)))

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

  async getQuestion(opts): Promise<QnaItem> {
    // TODO remove the object option it's useless
    let filename
    if (typeof opts === 'string') {
      filename = `${opts}.json`
    } else {
      // opts object
      filename = opts.filename
    }
    const data = await this.bp.ghost.forBot(this.botId).readFileAsString(this.config.qnaDir, filename)

    return this.migrate_11_2_to_11_3(JSON.parse(data))
  }

  async fetchAllQuestions(opts?: Paging) {
    try {
      let questions = await this.bp.ghost.forBot(this.botId).directoryListing(this.config.qnaDir, '*.json')
      if (opts && opts.start && opts.count) {
        questions = questions.slice(opts.start, opts.start + opts.count)
      }

      return Promise.map(questions, question => this.getQuestion({ filename: question }))
    } catch (err) {
      this.bp.logger.warn(`Error while reading questions. ${err}`)
      return []
    }
  }

  async filterByCategoryAndQuestion(question: string, categories: string[]) {
    const allQuestions = await this.fetchAllQuestions()
    const filteredQuestions = allQuestions.filter(q => {
      const { questions, category } = q.data

      const allquestions = _.flatten(Object.keys(question).map(key => questions[key]))
      const hasMatch =
        allquestions
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
      items = await this.fetchAllQuestions({
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
    const questions = await this.fetchAllQuestions()
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
