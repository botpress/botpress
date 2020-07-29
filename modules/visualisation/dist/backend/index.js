"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("bluebird-global");

var _on_bot_mount = require("../module_lifecycle/on_bot_mount");

var _en = _interopRequireDefault(require("../translations/en.json"));

var _fr = _interopRequireDefault(require("../translations/fr.json"));

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const state = {};

const onServerStarted = async bp_sdk => {
  bp_sdk.logger.warn('You are using Botpress New QNA module which is meant to be tested and released only by the botpress team');
};

const onServerReady = async bp_sdk => {
  await (0, _api.default)(bp_sdk, state);
};

const onBotMount = (0, _on_bot_mount.getOnBotMount)(state);

const onModuleUnmount = async bp_sdk => {
  bp_sdk.events.removeMiddleware('visualisation.incoming');
  bp_sdk.http.deleteRouterForBot('visualisation');
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onModuleUnmount,
  translations: {
    en: _en.default,
    fr: _fr.default
  },
  definition: {
    name: 'visualisation',
    menuIcon: 'assessment',
    menuText: 'Visualisation',
    fullName: 'Visualisation',
    homepage: 'https://botpress.com',
    experimental: true
  }
};
var _default = entryPoint; // TODO add a kmean like pairwise intent

exports.default = _default;
//# sourceMappingURL=index.js.map