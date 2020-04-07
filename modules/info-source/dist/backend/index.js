"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

async function onBotMount(bp, botId) {}

async function onBotUnmount(bp, botId) {}

async function onServerStarted(bp) {}

const entryPoint = {
  onServerStarted,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'info-source',
    fullName: 'MSSS Info Covid-19',
    noInterface: true,
    // This prevents your module from being displayed in the menu, since we only add custom components here
    homepage: 'https://botpress.com'
  }
};
var _default = entryPoint;
exports.default = _default;
//# sourceMappingURL=index.js.map