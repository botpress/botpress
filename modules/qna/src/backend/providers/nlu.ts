import Bluebird from 'bluebird'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import generate from 'nanoid/generate'
import path from 'path'

import { Pagination, QnaStorage, SDK } from '../types'

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
  qnaDir: string

  constructor(bp: SDK, config) {
    this.bp = bp

    this.qnaDir = config.qnaDir
  }

  async initialize() {
    //  mkdirp.sync(path.resolve(this.projectDir, this.qnaDir))
  }

  async syncNlu() {
    // TODO: Fix because nlu not defined
    /*
    if (await this.bp.nlu.provider.checkSyncNeeded()) {
      await this.bp.nlu.provider.sync()
    }*/
  }

  async update(data, id) {
    id = id || getQuestionId(data)
    if (data.enabled) {
      // TODO: Fix because nlu not defined
      /*
      await this.bp.nlu.forBot('bot123').storage.saveIntent(getIntentId(id), {
        entities: [],
        utterances: normalizeQuestions(data.questions)
      })*/
    } else {
      await this.bp.nlu.storage.deleteIntent(getIntentId(id))
    }

    await this.syncNlu()
    await this.bp.ghost
      .forBot('bot123')
      .upsertFile(this.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))

    return id
  }

  async insert(qna) {
    const ids = await Bluebird.all(
      (_.isArray(qna) ? qna : [qna]).map(async data => {
        const id = getQuestionId(data)
        // TODO: Fix because nlu not defined
        /*
        if (data.enabled) {
          await this.bp.nlu.forBot('bot123').storage.saveIntent(getIntentId(id), {
            entities: [],
            utterances: normalizeQuestions(data.questions)
          })
        }*/
        await this.bp.ghost
          .forBot('bot123')
          .upsertFile(this.qnaDir, `${id}.json`, JSON.stringify({ id, data }, undefined, 2))
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
    const data = await this.bp.ghost.forBot('bot123').readFileAsString(this.qnaDir, filename)
    return JSON.parse(data)
  }

  async count() {
    const questions = await this.bp.ghost.forBot('bot123').directoryListing(this.qnaDir, '*.json')
    return questions.length
  }

  async all(opts?: Pagination) {
    let questions = await this.bp.ghost.forBot('bot123').directoryListing(this.qnaDir, '*.json')
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
        // TODO: Fix because nlu not defined
        /*if (data.data.enabled) {
          await this.bp.nlu.storage.deleteIntent(getIntentId(id))
        }*/
        await this.bp.ghost.forBot('bot123').deleteFile(this.qnaDir, `${id}.json`)
      })
    )
    await this.syncNlu()
  }

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
