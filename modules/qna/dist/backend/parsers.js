"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.csvParse = exports.jsonParse = void 0;

var _sync = _interopRequireDefault(require("csv-parse/lib/sync"));

var _get = _interopRequireDefault(require("lodash/get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const parseFlow = str => {
  const [redirectFlow, redirectNode = ''] = str.split('#');
  return {
    redirectFlow,
    redirectNode
  };
};

const jsonParse = jsonContent => jsonContent.map(({
  questions,
  answer: instruction,
  answer2,
  action
}, i) => {
  if (!['text', 'redirect', 'text_redirect'].includes(action)) {
    throw new Error(`Failed to process CSV-row ${i + 1}: action should be either "text", "redirect" or "text_redirect"`);
  }

  let redirectInstruction = undefined;
  let textAnswer = '';

  if (action === 'text') {
    textAnswer = instruction;
  } else if (action === 'redirect') {
    redirectInstruction = instruction;
  } else if (action === 'text_redirect') {
    textAnswer = instruction;
    redirectInstruction = answer2;
  }

  const flowParams = redirectInstruction ? parseFlow(redirectInstruction) : {
    redirectFlow: '',
    redirectNode: ''
  };
  return {
    questions,
    action,
    answer: textAnswer,
    ...flowParams
  };
});

exports.jsonParse = jsonParse;

const csvParse = csvContent => {
  const mergeRows = (acc, {
    question,
    answer,
    answer2,
    action
  }) => {
    const [prevRow] = acc.slice(-1);
    const isSameAnswer = prevRow && prevRow.answer === answer && (!answer2 || answer2 === prevRow.answer2);

    if (isSameAnswer) {
      return [...acc.slice(0, acc.length - 1), { ...prevRow,
        questions: [...prevRow.questions, question]
      }];
    }

    return [...acc, {
      answer,
      answer2,
      action,
      questions: [question]
    }];
  };

  const rows = (0, _sync.default)(csvContent, {
    columns: ['question', 'action', 'answer', 'answer2']
  }).reduce(mergeRows, []); // We trim the header if detected in the first row

  if ((0, _get.default)(rows, '0.action') === 'action') {
    rows.splice(0, 1);
  }

  return jsonParse(rows);
};

exports.csvParse = csvParse;