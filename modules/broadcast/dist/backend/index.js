"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("bluebird-global");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _api = _interopRequireDefault(require("./api"));

var _daemon = _interopRequireDefault(require("./daemon"));

var _db = _interopRequireDefault(require("./db"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let db = undefined;

const onInit = async bp => {
  db = new _db.default(bp);
  await db.initialize();
  (0, _daemon.default)(bp, db);
};

const onReady = async bp => {
  await (0, _api.default)(bp, db);
};

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

const entryPoint = {
  onInit,
  onReady,
  config: {},
  serveFile,
  definition: {
    name: 'broadcast',
    menuIcon: 'settings_input_antenna',
    fullName: 'Broadcast',
    homepage: 'https://botpress.io'
  }
};
var _default = entryPoint;
exports.default = _default;