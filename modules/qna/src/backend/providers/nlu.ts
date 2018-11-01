import axios from 'axios'
import Bluebird from 'bluebird'
import { Paging } from 'botpress/sdk'
import _ from 'lodash'
import shortid from 'shortid'

import { QnaStorage, SDK } from '../qna'

const safeId = (length = 10) => shortid.generate('1234567890abcdefghijklmnopqrsuvwxyz', length)

const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

const getQuestionId = ({ questions }) =>
  `${safeId()}_${slugify(questions[0])
    .replace(/^_+/, '')
    .substring(0, 50)
    .replace(/_+$/, '')}`

export const NLU_PREFIX = '__qna__'

const getIntentId = id => `${NLU_PREFIX}${id}`

const normalizeQuestions = questions =>
  questions
    .map(q =>
      q
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

export default class Storage implements QnaStorage {
  private bp: SDK
  private config
  private botId: string
  private axiosConfig
  private categories: string[]

  constructor(bp: SDK, config, botId) {
    this.bp = bp
    this.config = config
    this.botId = botId

    if (config.qnaCategories && config.qnaCategories.length > 0) {
      this.categories = config.qnaCategories.split(',')
    }
  }

  async initialize() {
    this.axiosConfig = await this.bp.http.getAxiosConfigForBot(this.botId)
    this.syncQnaToNlu()
  }

  async syncNlu() {
    const { data: isNeeded } = await axios.get('/api/ext/nlu/sync/check', this.axiosConfig)
    if (isNeeded) {
      await axios.get('/api/ext/nlu/sync', this.axiosConfig)
    }
  }

  // TODO Find better way to implement. When manually copying QNA, intents are not created.
  // Manual edit & save of each one is required for the intent to be created.
  async syncQnaToNlu() {
    const allQuestions = await this.fetchAllQuestions()
    const { data: allIntents } = await axios.get(`/api/ext/nlu/intents`, this.axiosConfig)

    for (const question of allQuestions) {
      const found = _.find(allIntents, intent => intent.name === getIntentId(question.id).toLowerCase())

      if (question.data.enabled && !found) {
        const intent = {
          entities: [],
          utterances: normalizeQuestions(question.data.questions)
        }

        await axios.post(`/api/ext/nlu/intents/${getIntentId(question.id)}`, intent, this.axiosConfig)
        this.bp.logger.info(`Created NLU intent for QNA ${question.id}`)
      }
    }

    await this.syncNlu()
  }

  async update(data, id) {
    id = id || getQuestionId(data)
    if (data.enabled) {
      const intent = {
        entities: [],
        utterances: normalizeQuestions(data.questions)
      }

      axios.post(`/api/ext/nlu/intents/${getIntentId(id)}`, intent, this.axiosConfig)
    } else {
      await axios.delete(`/api/ext/nlu/intents/${getIntentId(id)}`, this.axiosConfig)
    }

    await this.syncNlu()
    await this.bp.ghost
      .forBot(this.botId)
      .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))

    return id
  }

  async insert(qna, statusCb) {
    const ids = await Promise.each(_.isArray(qna) ? qna : [qna], async (data, i) => {
      const id = getQuestionId(data)

      if (data.enabled) {
        const intent = {
          entities: [],
          utterances: normalizeQuestions(data.questions)
        }
        await axios.post(`/api/ext/nlu/intents/${getIntentId(id)}`, intent, this.axiosConfig)
      }

      await this.bp.ghost
        .forBot(this.botId)
        .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))
      statusCb && statusCb(i + 1)
    })

    await this.syncNlu()

    return ids
  }

  async getQuestion(opts) {
    let filename
    if (typeof opts === 'string') {
      filename = `${opts}.json`
    } else {
      // opts object
      filename = opts.filename
    }
    const data = await this.bp.ghost.forBot(this.botId).readFileAsString(this.config.qnaDir, filename)
    return JSON.parse(data)
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

  async filterByCategoryAndQuestion({ question, categories }) {
    const allQuestions = await this.fetchAllQuestions()
    const filteredQuestions = allQuestions.filter(q => {
      const { questions, category } = q.data

      const isRightId =
        questions
          .join('\n')
          .toLowerCase()
          .indexOf(question.toLowerCase()) !== -1

      if (!categories.length) {
        return isRightId
      }

      if (!question) {
        return category && categories.indexOf(category) !== -1
      }
      return isRightId && category && categories.indexOf(category) !== -1
    })

    return filteredQuestions.reverse()
  }

  async getQuestions({ question = '', categories = [] }, { limit = 50, offset = 0 }) {
    let items = []
    let count = 0

    if (!(question || categories.length)) {
      items = await this.fetchAllQuestions({
        start: offset ? parseInt(offset) : undefined,
        count: limit ? parseInt(limit) : undefined
      })
      count = await this.count()
    } else {
      const tmpQuestions = await this.filterByCategoryAndQuestion({ question, categories })
      items = tmpQuestions.slice(offset, offset + limit)
      count = tmpQuestions.length
    }
    return { items, count }
  }

  async count() {
    const questions = await this.fetchAllQuestions()
    return questions.length
  }

  async delete(qnaId) {
    const ids = _.isArray(qnaId) ? qnaId : [qnaId]
    if (ids.length === 0) {
      return
    }
    await Promise.all(
      ids.map(async id => {
        const data = await this.getQuestion(id)

        if (data.data.enabled) {
          axios.delete(`/api/ext/nlu/intents/${getIntentId(id)}`, this.axiosConfig)
        }
        await this.bp.ghost.forBot(this.botId).deleteFile(this.config.qnaDir, `${id}.json`)
      })
    )
    await this.syncNlu()
  }

  async answersOn(text) {
    const extract = await axios.post('/api/ext/nlu/extract', { text }, this.axiosConfig)
    const intents = _.chain([extract.data['intent'], ...extract.data['intents']])
      .uniqBy('name')
      .filter(({ name }) => name.startsWith('__qna__'))
      .orderBy(['confidence'], ['desc'])
      .value()

    return Promise.all(
      intents.map(async ({ name, confidence }) => {
        const {
          data: { questions, answer }
        } = await this.getQuestion(name.replace('__qna__', ''))
        return { questions, answer, confidence, id: name, metadata: [] }
      })
    )
  }

  getCategories() {
    return this.categories
  }

  hasCategories() {
    return this.categories && this.categories.length > 0
  }
}
