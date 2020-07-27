"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOnBotMount = getOnBotMount;

var _botpress_predictor = require("../models/botpress_predictor");

var _embedder = require("../models/embedder");

function getOnBotMount(state) {
  return async (bp, botId) => {
    state.botId = botId;
    state.ghost = bp.ghost.forBot(botId); // const emb = new BotpressEmbedder(botId, state.ghost)

    const emb = new _embedder.PythonEmbedder(state.ghost);
    state.embedder = emb;
    const axiosConfig = await bp.http.getAxiosConfigForBot(botId);
    state.axiosConfig = axiosConfig;
    const predictor = new _botpress_predictor.BotpressPredictor(axiosConfig, botId);
    state.predictor = predictor;
    await state.embedder.load(axiosConfig); // bp.logger.info('Embedding intents in train and test set')
    // const { train, test } = await getTrainTestDatas(state)
    // bp.logger.info('Done loading datas')
    // state.trainDatas = train
    // state.testDatas = test
  };
}
//# sourceMappingURL=on_bot_mount.js.map