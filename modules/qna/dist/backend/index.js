"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _api = _interopRequireDefault(require("./api"));

var _setup = _interopRequireDefault(require("./setup"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const botScopedStorage = new Map();

const onInit = async bp => {
  await (0, _setup.default)(bp, botScopedStorage);
};

const onReady = async bp => {
  await (0, _api.default)(bp, botScopedStorage);
};

const serveFile = async filePath => {
  filePath = filePath.toLowerCase();
  const mapping = {
    'index.js': _path.default.join(__dirname, '../web/web.bundle.js') // Web views

  };

  if (mapping[filePath]) {
    return _fs.default.readFileSync(mapping[filePath]);
  }

  return Buffer.from('');
};

const config = {
  qnaDir: {
    type: 'string',
    required: true,
    default: './qna',
    env: 'QNA_DIR'
  },
  textRenderer: {
    type: 'string',
    required: true,
    default: '#builtin_text',
    env: 'QNA_TEXT_RENDERER'
  },
  exportCsvEncoding: {
    type: 'string',
    required: false,
    default: 'utf8',
    env: 'QNA_EXPORT_CSV_ENCODING'
  },
  qnaMakerApiKey: {
    type: 'string',
    required: false,
    default: '',
    env: 'QNA_MAKER_API_KEY'
  },
  qnaMakerKnowledgebase: {
    type: 'string',
    required: false,
    default: 'botpress',
    env: 'QNA_MAKER_KNOWLEDGEBASE'
  }
};
const defaultConfigJson = `
{
  "qnaDir": "./qna",
  "textRenderer": "#builtin_text"
}`;
const entryPoint = {
  onInit,
  onReady,
  config,
  defaultConfigJson,
  serveFile,
  definition: {
    name: 'qna',
    menuIcon: 'question_answer',
    fullName: 'QNA',
    homepage: 'https://botpress.io'
  }
};
var _default = entryPoint;
exports.default = _default;