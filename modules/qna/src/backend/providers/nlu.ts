import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

import { QnaEntry, QnaStorage } from '../qna'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

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
    await this.syncQnaToNlu()
  }

  // TODO Find better way to implement. When manually copying QNA, intents are not created.
  // Manual edit & save of each one is required for the intent to be created.
  async syncQnaToNlu() {
    const axiosConfig = await this.getAxiosConfig()
    const allQuestions = await this.fetchAllQuestions()
    const { data: allIntents } = await axios.get(`/mod/nlu/intents`, axiosConfig)

    for (const question of allQuestions) {
      const matchedIntent = _.find(allIntents, intent => intent.name === getIntentId(question.id).toLowerCase())

      if (question.data.enabled && !matchedIntent) {
        const intent = {
          name: getIntentId(question.id),
          entities: [],
          contexts: [question.data.category || 'global'],
          utterances: normalizeQuestions(question.data.questions)
        }

        await axios.post(`/mod/nlu/intents`, intent, axiosConfig)
        this.bp.logger.info(`Created NLU intent for QNA ${question.id}`)
      } else if (!question.data.enabled && matchedIntent) {
        await this.bp.ghost.forBot(this.botId).deleteFile(this.config.qnaDir, `${question.id}.json`)
      }
    }
  }

  async update(data: QnaEntry, id: string): Promise<string> {
    const axiosConfig = await this.getAxiosConfig()
    id = id || getQuestionId(data)
    if (data.enabled) {
      const intent = {
        name: getIntentId(id),
        entities: [],
        contexts: [data.category || 'global'],
        utterances: normalizeQuestions(data.questions)
      }

      await this.checkForDuplicatedQuestions(intent.utterances, id)
      await axios.post(`/mod/nlu/intents`, intent, axiosConfig)
    } else {
      await axios.delete(`/mod/nlu/intents/${getIntentId(id)}`, axiosConfig)
    }

    await this.bp.ghost
      .forBot(this.botId)
      .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))

    return id
  }

  async insert(qna: QnaEntry | QnaEntry[], statusCb): Promise<string[]> {
    const ids = await Promise.mapSeries(_.isArray(qna) ? qna : [qna], async (data, i) => {
      const id = getQuestionId(data)

      if (data.enabled) {
        const intent = {
          name: getIntentId(id),
          entities: [],
          contexts: [data.category || 'global'],
          utterances: normalizeQuestions(data.questions)
        }

        await this.checkForDuplicatedQuestions(intent.utterances)
        await axios.post(`/mod/nlu/intents`, intent, await this.getAxiosConfig())
      }

      await this.bp.ghost
        .forBot(this.botId)
        .upsertFile(this.config.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))
      statusCb && statusCb(i + 1)
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

  async getQuestion(opts) {
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
        return isRightId || q.id.includes(question)
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

    const deletePromise = async (id): Promise<void> => {
      const data = await this.getQuestion(id)
      if (data.data.enabled) {
        await axios.delete(`/mod/nlu/intents/${getIntentId(id)}`, await this.getAxiosConfig())
      }
      return this.bp.ghost.forBot(this.botId).deleteFile(this.config.qnaDir, `${id}.json`)
    }

    await Promise.all(ids.map(deletePromise))
  }

  async answersOn(text) {
    const extract = await axios.post('/mod/nlu/extract', { text }, await this.getAxiosConfig())
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
