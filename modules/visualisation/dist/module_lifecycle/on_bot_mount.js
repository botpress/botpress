"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOnBotMount = getOnBotMount;

var _botpress_predictor = require("../models/botpress_predictor");

var _embedder = require("../models/embedder");

function getOnBotMount(state) {
  return async (bp, botId) => {
    state[botId] = {};
    state[botId].ghost = bp.ghost.forBot(botId);
    const emb = new _embedder.BotpressEmbedder(botId, state[botId].ghost); // const emb = new PythonEmbedder(state.ghost)

    state[botId].embedder = emb;
    const axiosConfig = await bp.http.getAxiosConfigForBot(botId);
    state[botId].axiosConfig = axiosConfig;
    const predictor = new _botpress_predictor.BotpressPredictor(axiosConfig, botId);
    state[botId].predictor = predictor;
    await state[botId].embedder.load(axiosConfig);
  };
}
//# sourceMappingURL=on_bot_mount.js.map