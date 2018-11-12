"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("bluebird-global");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _setup = _interopRequireDefault(require("./setup"));

var _skillChoice = _interopRequireDefault(require("./skill-choice"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const onServerStarted = async bp => {};

const onServerReady = async bp => {
  await (0, _setup.default)(bp);
};

const flowGenerator = [{
  name: 'choice',
  generator: _skillChoice.default.generateFlow
}];

const serveFile = async filePath => {
  filePath = filePath.toLowerCase();
  const mapping = {
    'index.js': _path.default.join(__dirname, '../web/web.bundle.js') // Web views

  };

  if (mapping[filePath]) {
    return _fs.default.readFileSync(mapping[filePath]);
  }

  return new Buffer('');
};

const config = {
  defaultContentElement: {
    type: 'string',
    required: true,
    default: 'builtin_single-choice',
    env: 'SKILL_CHOICE_CONTENT_ELEMENT'
  },
  defaultContentRenderer: {
    type: 'string',
    required: true,
    default: '#builtin_single-choice',
    env: 'SKILL_CHOICE_CONTENT_RENDERER'
  },
  defaultMaxAttempts: {
    type: 'string',
    required: false,
    default: '3',
    env: 'SKILL_CHOICE_MAX_ATTEMPTS'
  },
  matchNumbers: {
    type: 'bool',
    required: false,
    default: true,
    env: 'SKILL_CHOICE_MATCH_NUMBERS'
  },
  disableIntegrityCheck: {
    type: 'bool',
    required: false,
    default: false,
    env: 'SKILL_DISABLE_INTEGRITY_CHECK'
  },
  matchNLU: {
    type: 'bool',
    required: false,
    default: true,
    env: 'SKILL_CHOICE_MATCH_NLU'
  }
};
const defaultConfigJson = `
{
  "defaultContentElement": "builtin_single-choice",
  "defaultContentRenderer": "#builtin_single-choice",
  "defaultMaxAttempts": "3",
  "disableIntegrityCheck": false,
  "matchNumbers": true, // This allows people to type a number to match choices (like 1, 2, 3)
  "matchNLU": true
}
`;
const entryPoint = {
  onServerStarted,
  onServerReady,
  config,
  defaultConfigJson,
  serveFile: serveFile,
  definition: {
    name: 'skill-choice',
    menuIcon: 'fiber_smart_record',
    fullName: 'Basic Skills',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: {
      stretched: true
    }
  },
  flowGenerator
};
var _default = entryPoint;
exports.default = _default;