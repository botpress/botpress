"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const botpress_xx_1 = require("botpress-xx");
const chalk_1 = __importDefault(require("chalk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log(chalk_1.default `===========================`);
console.log(chalk_1.default `=     {bold Botpress Server}     =`);
console.log(chalk_1.default `=       Version 0.1       =`);
console.log(chalk_1.default `=       {yellow Pre-release}       =`);
console.log(chalk_1.default `===========================`);
try {
    const modules = new Map();
    modules.set('webchat', require('@botpress/channel-web'));
    botpress_xx_1.Botpress.start({
        modules
    });
}
catch (e) {
    console.log(chalk_1.default.red('Error starting botpress'));
    console.log(e);
}
//# sourceMappingURL=index.js.map