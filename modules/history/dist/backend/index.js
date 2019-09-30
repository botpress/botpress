"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("bluebird-global");

var _api = _interopRequireDefault(require("./api"));

var _db = _interopRequireDefault(require("./db"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const onServerStarted = async bp => {};

const onServerReady = async bp => {
  const db = new _db.default(bp);
  db.initialize();
  (0, _api.default)(bp, db);
};

const entryPoint = {
  onServerReady,
  onServerStarted,
  definition: {
    name: 'history',
    fullName: 'History',
    menuText: 'History',
    homepage: 'https://botpress.io',
    menuIcon: 'history',
    experimental: true
  }
};
var _default = entryPoint;
exports.default = _default;
//# sourceMappingURL=index.js.map