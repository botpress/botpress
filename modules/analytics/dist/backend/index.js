"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _api = _interopRequireDefault(require("./api"));

var _db = require("./db");

var _job = _interopRequireDefault(require("./job"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const onServerStarted = async bp => {};

const onServerReady = async bp => {
  const db = new _db.AnalyticsDatabase(bp.database);
  (0, _api.default)(db);
  const job = new _job.default(bp, db);
  await job.initialize();
  process.BOTPRESS_EVENTS.on('core.analytics', async arg => job.addMetric(arg));
  job.start();
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'analytics',
    menuIcon: 'timeline',
    menuText: 'Analytics',
    noInterface: false,
    fullName: 'Analytics',
    homepage: 'https://botpress.com'
  }
};
var _default = entryPoint;
exports.default = _default;
//# sourceMappingURL=index.js.map