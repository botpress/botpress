"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _client = require("./client");

let router;
const clients = {};

const onServerStarted = async bp => {
  await (0, _client.setupMiddleware)(bp, clients);
};

const onServerReady = async bp => {
  router = bp.http.createRouterForBot('channel-slack', {
    checkAuthentication: false,
    enableJsonBodyParser: false,
    enableUrlEncoderBodyParser: false
  });
};

const onBotMount = async (bp, botId) => {
  const config = await bp.config.getModuleConfigForBot('channel-slack', botId);

  if (config.enabled) {
    const bot = new _client.SlackClient(bp, botId, config, router);
    await bot.initialize();
    clients[botId] = bot;
  }
};

const onBotUnmount = async (bp, botId) => {
  const client = clients[botId];

  if (!client) {
    return;
  }

  delete clients[botId];
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'channel-slack',
    menuIcon: 'none',
    menuText: 'Channel Slack',
    noInterface: true,
    fullName: 'Slack',
    homepage: 'https://botpress.io'
  }
};
var _default = entryPoint;
exports.default = _default;
//# sourceMappingURL=index.js.map