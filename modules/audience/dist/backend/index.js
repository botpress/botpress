"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const onInit = async bp => {};

const onReady = async bp => {
  await (0, _api.default)(bp);
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

const entryPoint = {
  onInit,
  onReady,
  config: {},
  serveFile,
  definition: {
    name: 'audience',
    menuIcon: 'people',
    fullName: 'Audience',
    homepage: 'https://botpress.io'
  }
};
var _default = entryPoint;
exports.default = _default;