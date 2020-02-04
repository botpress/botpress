"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("bluebird-global");

var _analytics = _interopRequireDefault(require("./analytics"));

var _api = _interopRequireDefault(require("./api"));

var _setup = _interopRequireDefault(require("./setup"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const analyticsByBot = {};
const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback'];

const onServerStarted = async bp => {
  await (0, _setup.default)(bp, interactionsToTrack);
};

const onServerReady = async bp => {
  await (0, _api.default)(bp, analyticsByBot);
};

const onBotMount = async (bp, botId) => {
  const analytics = new _analytics.default(bp, botId);
  analyticsByBot[botId] = analytics;
  await analytics.start();
};

const onBotUnmount = async (bp, botId) => {
  await analyticsByBot[botId].stop();
  delete analyticsByBot[botId];
};

const onModuleUnmount = async bp => {
  bp.events.removeMiddleware('analytics.incoming');
  bp.events.removeMiddleware('analytics.outgoing');
  bp.http.deleteRouterForBot('analytics');
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline',
    menuText: 'Analytics'
  }
};
var _default = entryPoint;
exports.default = _default;
//# sourceMappingURL=index.js.map