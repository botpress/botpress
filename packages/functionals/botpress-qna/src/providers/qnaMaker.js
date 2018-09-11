import axios from 'axios'
import _ from 'lodash'
import ms from 'ms'
import Promise from 'bluebird'

// Handles QnA Maker API downcasing all key-values in metadata
const markUpperCase = str => str.replace(/([A-Z])/g, 'a-a-a-a-a$1a-a-a-a-a')
const restoreUpperCase = str => str.replace(/a-a-a-a-a([a-zA-Z])a-a-a-a-a/g, (_, c) => c.toUpperCase())
const keysToRestore = { redirectflow: 'redirectFlow', redirectnode: 'redirectNode' }

const qnaItemData = ({ questions, answer, metadata }) => ({
  questions,
  answer,
  ..._.fromPairs(metadata.map(({ name, value }) => [keysToRestore[name] || name, restoreUpperCase(value)])),
  enabled: (metadata.find(({ name }) => name === 'enabled') || {}).value === 'true'
})

const prepareMeta = data =>
  _.chain(data)
    .pick(['enabled', 'action', 'redirectFlow', 'redirectNode'])
    .toPairs()
    .map(([name, value]) => ({ name, value: _.isString(value) ? markUpperCase(value) : value }))
    .filter(({ value }) => !_.isUndefined(value) && value !== '')
    .value()

export default class Storage {
  constructor({ bp, config }) {
    const baseURL = 'https://westus.api.cognitive.microsoft.com/qnamaker/v4.0'
    const headers = { 'Ocp-Apim-Subscription-Key': config.qnaMakerApiKey }
    Object.assign(this, {
      bp,
      client: axios.create({ baseURL, headers }),
      knowledgebaseName: config.qnaMakerKnowledgebase
    })
  }

  async initialize() {
    const isBpKnowledgbase = ({ name }) => name === this.knowledgebaseName
    const { data: { knowledgebases: initialKnowledgebases } } = await this.client.get('/knowledgebases/')
    const existingKb = initialKnowledgebases.find(isBpKnowledgbase)
    if (existingKb) {
      this.knowledgebase = existingKb
    } else {
      const { data: { operationId } } = await this.client.post('/knowledgebases/create', {
        name: this.knowledgebaseName
      })
      await this.waitForOperationToFinish(operationId)
      const { data: { knowledgebases } } = await this.client.get('/knowledgebases/')
      this.knowledgebase = knowledgebases.find(isBpKnowledgbase)
    }

    this.endpointKey = (await this.client.get('/endpointkeys')).data.primaryEndpointKey
  }

  publish = () => this.client.post(`/knowledgebases/${this.knowledgebase.id}`)

  patchKb = params => this.client.patch(`/knowledgebases/${this.knowledgebase.id}`, params)

  waitForOperationToFinish = async operationId => {
    await Promise.delay(200)
    while (true) {
      const { data, headers: { 'retry-after': timeout } } = await this.client.get(`/operations/${operationId}`)
      if (!['Running', 'NotStarted'].includes(data.operationState)) {
        return
      }
      this.bp.logger.info(
        `[QNA] Waiting 3s for ${data.operationState} QnA Maker's #${operationId} operation to finish...`
      )
      await Promise.delay(ms('3s'))
    }
  }

  async update(data, id) {
    const prevData = await this.getQuestion(id)

    const questionsChanged = _.isEqual(data.questions, prevData.questions)
    const questionsToAdd = _.difference(data.questions, prevData.questions)
    const questionsToDelete = _.difference(prevData.questions, data.questions)

    const { data: { operationId } } = await this.patchKb({
      update: {
        qnaList: [
          {
            id,
            answer: data.answer,
            ...(questionsChanged ? {} : { questions: { add: questionsToAdd, delete: questionsToDelete } }),
            metadata: { delete: prevData.metadata, add: prepareMeta(data) }
          }
        ]
      }
    })

    await this.waitForOperationToFinish(operationId)

    this.invalidateCache()
    await this.publish()
    return id
  }

  async insert(qna) {
    const qnas = _.isArray(qna) ? qna : [qna]
    const { data: { operationId } } = await this.patchKb({
      add: {
        qnaList: qnas.map(qna => ({ ..._.pick(qna, ['answer', 'questions']), metadata: prepareMeta(qna) }))
      }
    })

    await this.waitForOperationToFinish(operationId)
    this.invalidateCache()
    await this.publish()
    // TODO: should return ids (for consistency)
  }

  async fetchQuestions() {
    if (!this.questions) {
      const { data: { qnaDocuments } } = await this.client.get(`/knowledgebases/${this.knowledgebase.id}/test/qna/`)
      this.questions = qnaDocuments
    }

    return this.questions
  }

  invalidateCache = () => (this.questions = null)

  async getQuestion(id) {
    const questions = await this.fetchQuestions()
    return questions.find(({ id: qnaId }) => qnaId == id)
  }

  async count() {
    const questions = await this.fetchQuestions()
    return questions.length
  }

  async all({ limit, offset } = {}) {
    let questions = await this.fetchQuestions()
    if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
      questions = questions.slice(offset, offset + limit)
    }

    return questions.map(qna => ({ id: qna.id, data: qnaItemData(qna) }))
  }

  async answersOn(question) {
    const { data: { answers } } = await axios.post(
      `/qnamaker/knowledgebases/${this.knowledgebase.id}/generateAnswer`,
      { question, top: 10, strictFilters: [{ name: 'enabled', value: true }] },
      { baseURL: this.knowledgebase.hostName, headers: { Authorization: `EndpointKey ${this.endpointKey}` } }
    )

    return _.orderBy(answers, ['confidence'], ['desc']).map(answer => ({
      ..._.pick(answer, ['questions', 'answer', 'id']),
      confidence: answer.score / 100,
      ...qnaItemData(answer)
    }))
  }

  async delete(id) {
    const ids = _.isArray(id) ? id : [id]
    if (ids.length === 0) {
      return
    }
    const { data: { operationId } } = await this.client.patch(`/knowledgebases/${this.knowledgebase.id}`, {
      delete: { ids }
    })
    await this.waitForOperationToFinish(operationId)
    this.invalidateCache()
    await this.publish()
  }
}
