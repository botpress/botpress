"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _lodash = _interopRequireDefault(require("lodash"));

var _ms = _interopRequireDefault(require("ms"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Handles QnA Maker API downcasing all key-values in metadata
const markUpperCase = str => str.replace(/([A-Z])/g, 'a-a-a-a-a$1a-a-a-a-a');

const restoreUpperCase = str => str.replace(/a-a-a-a-a([a-zA-Z])a-a-a-a-a/g, (_, c) => c.toUpperCase());

const keysToRestore = {
  redirectflow: 'redirectFlow',
  redirectnode: 'redirectNode'
};

const qnaItemData = ({
  questions,
  answer,
  metadata
}) => ({
  questions,
  answer,
  ..._lodash.default.fromPairs(metadata.map(({
    name,
    value
  }) => [keysToRestore[name] || name, restoreUpperCase(value)])),
  enabled: (metadata.find(({
    name
  }) => name === 'enabled') || {}).value === 'true'
});

const prepareMeta = data => _lodash.default.chain(data).pick(['enabled', 'action', 'redirectFlow', 'redirectNode']).toPairs().map(([name, value]) => ({
  name,
  value: _lodash.default.isString(value) ? markUpperCase(value) : value
})).filter(({
  value
}) => !_lodash.default.isUndefined(value) && value !== '').value();

class Storage {
  constructor(bp, config) {
    _defineProperty(this, "bp", void 0);

    _defineProperty(this, "client", void 0);

    _defineProperty(this, "knowledgebase", void 0);

    _defineProperty(this, "endpointKey", void 0);

    _defineProperty(this, "knowledgebaseName", void 0);

    _defineProperty(this, "questions", void 0);

    _defineProperty(this, "publish", () => this.client.post(`/knowledgebases/${this.knowledgebase.id}`));

    _defineProperty(this, "patchKb", params => this.client.patch(`/knowledgebases/${this.knowledgebase.id}`, params));

    _defineProperty(this, "waitForOperationToFinish", async operationId => {
      await Promise.delay(200);

      while (true) {
        const {
          data,
          headers: {
            'retry-after': timeout
          }
        } = await this.client.get(`/operations/${operationId}`);

        if (!['Running', 'NotStarted'].includes(data.operationState)) {
          return;
        }

        this.bp.logger.info(`[QNA] Waiting 3s for ${data.operationState} QnA Maker's #${operationId} operation to finish...`);
        await Promise.delay((0, _ms.default)('3s'));
      }
    });

    _defineProperty(this, "invalidateCache", () => this.questions = undefined);

    this.bp = bp;
    const baseURL = 'https://westus.api.cognitive.microsoft.com/qnamaker/v4.0';
    const headers = {
      'Ocp-Apim-Subscription-Key': config.qnaMakerApiKey
    };
    Object.assign(this, {
      client: _axios.default.create({
        baseURL,
        headers
      }),
      knowledgebaseName: config.qnaMakerKnowledgebase
    });
  }

  async initialize() {
    const isBpKnowledgbase = ({
      name
    }) => name === this.knowledgebaseName;

    const {
      data: {
        knowledgebases: initialKnowledgebases
      }
    } = await this.client.get('/knowledgebases/');
    const existingKb = initialKnowledgebases.find(isBpKnowledgbase);

    if (existingKb) {
      this.knowledgebase = existingKb;
    } else {
      const {
        data: {
          operationId
        }
      } = await this.client.post('/knowledgebases/create', {
        name: this.knowledgebaseName
      });
      await this.waitForOperationToFinish(operationId);
      const {
        data: {
          knowledgebases
        }
      } = await this.client.get('/knowledgebases/');
      this.knowledgebase = knowledgebases.find(isBpKnowledgbase);
    }

    this.endpointKey = (await this.client.get('/endpointkeys')).data.primaryEndpointKey;
  }

  async update(data, id) {
    const prevData = await this.getQuestion(id);

    const questionsChanged = _lodash.default.isEqual(data.questions, prevData.questions);

    const questionsToAdd = _lodash.default.difference(data.questions, prevData.questions);

    const questionsToDelete = _lodash.default.difference(prevData.questions, data.questions);

    const {
      data: {
        operationId
      }
    } = await this.patchKb({
      update: {
        qnaList: [{
          id,
          answer: data.answer,
          ...(questionsChanged ? {} : {
            questions: {
              add: questionsToAdd,
              delete: questionsToDelete
            }
          }),
          metadata: {
            delete: prevData.metadata,
            add: prepareMeta(data)
          }
        }]
      }
    });
    await this.waitForOperationToFinish(operationId);
    this.invalidateCache();
    await this.publish();
    return id;
  }

  async insert(qna) {
    const qnas = _lodash.default.isArray(qna) ? qna : [qna];
    const {
      data: {
        operationId
      }
    } = await this.patchKb({
      add: {
        qnaList: qnas.map(qna => ({ ..._lodash.default.pick(qna, ['answer', 'questions']),
          metadata: prepareMeta(qna)
        }))
      }
    });
    await this.waitForOperationToFinish(operationId);
    this.invalidateCache();
    await this.publish(); // TODO: should return ids (for consistency)
  }

  async fetchQuestions() {
    if (!this.questions) {
      const {
        data: {
          qnaDocuments
        }
      } = await this.client.get(`/knowledgebases/${this.knowledgebase.id}/test/qna/`);
      this.questions = qnaDocuments;
    }

    return this.questions;
  }

  async getQuestion(id) {
    const questions = await this.fetchQuestions();
    return questions.find(({
      id: qnaId
    }) => qnaId == id);
  }

  async count() {
    const questions = await this.fetchQuestions();
    return questions.length;
  }

  async all(paging) {
    let questions = await this.fetchQuestions();

    if (paging && paging.start && paging.count) {
      questions = questions.reverse().slice(paging.start, paging.start + paging.count);
    }

    return questions.map(qna => ({
      id: qna.id,
      data: qnaItemData(qna)
    }));
  }

  async answersOn(question) {
    const {
      data: {
        answers
      }
    } = await _axios.default.post(`/qnamaker/knowledgebases/${this.knowledgebase.id}/generateAnswer`, {
      question,
      top: 10,
      strictFilters: [{
        name: 'enabled',
        value: true
      }]
    }, {
      baseURL: this.knowledgebase.hostName,
      headers: {
        Authorization: `EndpointKey ${this.endpointKey}`
      }
    });
    return _lodash.default.orderBy(answers, ['score'], ['asc']).map(answer => ({ ..._lodash.default.pick(answer, ['questions', 'answer', 'id']),
      confidence: answer.score / 100,
      ...qnaItemData(answer)
    }));
  }

  async delete(id) {
    const ids = _lodash.default.isArray(id) ? id : [id];

    if (ids.length === 0) {
      return;
    }

    const {
      data: {
        operationId
      }
    } = await this.client.patch(`/knowledgebases/${this.knowledgebase.id}`, {
      delete: {
        ids
      }
    });
    await this.waitForOperationToFinish(operationId);
    this.invalidateCache();
    await this.publish();
  }

}

exports.default = Storage;