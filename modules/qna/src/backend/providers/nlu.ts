import axios from 'axios'
import Bluebird from 'bluebird'
import _ from 'lodash'
import generate from 'nanoid/generate'

import { Pagination, QnaStorage, SDK } from '../qna'

const safeId = (length = 10) => generate('1234567890abcdefghijklmnopqrsuvwxyz', length)

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
  bp: SDK
  config
  botId: string
  axiosConfig

  constructor(bp: SDK, config, botId) {
    this.bp = bp
    this.config = config
    this.botId = botId
  }

  async initialize() {
    this.axiosConfig = await this.bp.http.getAxiosConfigForBot(this.botId)
  }

  async syncNlu() {
    const { data: isNeeded } = await axios.get('/api/ext/nlu/sync/check', this.axiosConfig)
    if (isNeeded) {
      await axios.get('/api/ext/nlu/sync', this.axiosConfig)
    }
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

  async insert(qna) {
    const ids = await Bluebird.all(
      (_.isArray(qna) ? qna : [qna]).map(async data => {
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
      })
    )

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

  async count() {
    const questions = await this.bp.ghost.forBot(this.botId).directoryListing(this.config.qnaDir, '*.json')
    return questions.length
  }

  async all(opts?: Pagination) {
    let questions = await this.bp.ghost.forBot(this.botId).directoryListing(this.config.qnaDir, '*.json')
    if (opts && opts.limit && opts.offset) {
      questions = questions.slice(opts.offset, opts.offset + opts.limit)
    }
    return Promise.map(questions, question => this.getQuestion({ filename: question }))
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

  // TODO Call the module's api instead of global object
  async answersOn(text) {
    const extract = await this.bp.nlu.provider.extract({ text })
    const intents = _.chain([extract.intent, ...extract.intents])
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
}
