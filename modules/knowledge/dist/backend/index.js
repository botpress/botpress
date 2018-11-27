"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classifier = require("./classifier");

var _indexer = require("./indexer");

const indexers = {};
const classifiers = {};

const onServerStarted = async bp => {
  _indexer.Indexer.ghostProvider = bp.ghost.forBot;
  _classifier.DocumentClassifier.ghostProvider = bp.ghost.forBot;
  bp.events.registerMiddleware({
    name: 'knowledge.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (event.type !== 'text') {
        next();
      } // TODO Append suggested replies here


      next();
    },
    order: 15,
    description: 'Finds content from Knowledge base files',
    enabled: true
  });
};

const onServerReady = async bp => {};

const onBotMount = async (bp, botId) => {
  classifiers[botId] = new _classifier.DocumentClassifier(botId);
  indexers[botId] = new _indexer.Indexer(botId, classifiers[botId]);
  await classifiers[botId].loadMostRecent();
};

const onBotUnmount = async (bp, botId) => {
  delete indexers[botId];
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'knowledge',
    menuIcon: 'question_answer',
    menuText: 'Knowledge',
    fullName: 'knowledge',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: {
      stretched: true
    }
  }
};
var _default = entryPoint;
exports.default = _default;