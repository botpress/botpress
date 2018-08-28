import mkdirp from 'mkdirp'
import path from 'path'
import _ from 'lodash'
import Promise from 'bluebird'
import generate from 'nanoid/generate'

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

export default class Storage {
  constructor({ bp, config }) {
    this.bp = bp
    this.ghost = bp.ghostManager
    this.projectDir = bp.projectLocation
    this.qnaDir = config.qnaDir
  }

  async initialize() {
    mkdirp.sync(path.resolve(this.projectDir, this.qnaDir))
    await this.ghost.addRootFolder(this.qnaDir, { filesGlob: '**/*.json' })
  }

  async syncNlu() {
    if (await this.bp.nlu.provider.checkSyncNeeded()) {
      await this.bp.nlu.provider.sync()
    }
  }

  async update(data, id) {
    id = id || getQuestionId(data)
    if (data.enabled) {
      await this.bp.nlu.storage.saveIntent(getIntentId(id), {
        entities: [],
        utterances: normalizeQuestions(data.questions)
      })
    } else {
      await this.bp.nlu.storage.deleteIntent(getIntentId(id))
    }
    this.syncNlu()
    await this.ghost.upsertFile(this.qnaDir, `${id}.json`, JSON.stringify({ id, data }, null, 2))
    return id
  }

  async insert(qna) {
    const ids = await Promise.all(
      (_.isArray(qna) ? qna : [qna]).map(async data => {
        const id = getQuestionId(data)
        if (data.enabled) {
          await this.bp.nlu.storage.saveIntent(getIntentId(id), {
            entities: [],
            utterances: normalizeQuestions(data.questions)
          })
        }
        await this.ghost.upsertFile(this.qnaDir, `${id}.json`, JSON.stringify({ id, data }, null, 2))
      })
    )
    this.syncNlu()
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
    const data = await this.ghost.readFile(this.qnaDir, filename)
    return JSON.parse(data)
  }

  async count() {
    const questions = await this.ghost.directoryListing(this.qnaDir, '.json')
    return questions.length
  }

  async all({ limit, offset } = {}) {
    let questions = await this.ghost.directoryListing(this.qnaDir, '.json')
    if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
      questions = questions.slice(offset, offset + limit)
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
          await this.bp.nlu.storage.deleteIntent(getIntentId(id))
        }
        await this.ghost.deleteFile(this.qnaDir, `${id}.json`)
      })
    )
    this.syncNlu()
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
        const { data: { questions, answer } } = await this.getQuestion(name.replace('__qna__', ''))
        return { questions, answer, confidence, id: name, metadata: [] }
      })
    )
  }
}
