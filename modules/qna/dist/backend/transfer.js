"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareExport = exports.importQuestions = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var parsers = _interopRequireWildcard(require("./parsers.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const importQuestions = async (questions, params) => {
  const {
    storage,
    config,
    format = 'json',
    statusCallback,
    uploadStatusId
  } = params;
  statusCallback(uploadStatusId, 'Calculating diff with existing questions');
  const existingQuestions = (await storage.all()).map(item => JSON.stringify(_lodash.default.omit(item.data, 'enabled')));
  const parsedQuestions = typeof questions === 'string' ? parsers[`${format}Parse`](questions) : questions;
  const questionsToSave = parsedQuestions.filter(item => !existingQuestions.includes(JSON.stringify(item)));

  if (config.qnaMakerApiKey) {
    return storage.insert(questionsToSave.map(question => ({ ...question,
      enabled: true
    })));
  }

  let questionsSavedCount = 0;
  return Promise.each(questionsToSave, question => storage.insert({ ...question,
    enabled: true
  }).then(() => {
    questionsSavedCount += 1;
    statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${questionsToSave.length} questions`);
  }));
};

exports.importQuestions = importQuestions;

const prepareExport = async (storage, {
  flat = false
} = {}) => {
  const qnas = await storage.all();
  return _lodash.default.flatMap(qnas, question => {
    const {
      data
    } = question;
    const {
      questions,
      answer: textAnswer,
      action,
      redirectNode,
      redirectFlow
    } = data;
    let answer = textAnswer;
    let answer2 = undefined;

    if (action === 'redirect') {
      answer = redirectFlow;

      if (redirectNode) {
        answer += '#' + redirectNode;
      }
    } else if (action === 'text_redirect') {
      answer2 = redirectFlow;

      if (redirectNode) {
        answer2 += '#' + redirectNode;
      }
    }

    if (!flat) {
      return {
        questions,
        action,
        answer,
        answer2
      };
    }

    return questions.map(question => ({
      question,
      action,
      answer,
      answer2
    }));
  });
};

exports.prepareExport = prepareExport;