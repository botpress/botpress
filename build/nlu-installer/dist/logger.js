"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var PREFIX = '[NLU Installer]';
exports.default = {
    info: function (log) {
        // eslint-disable-next-line no-console
        console.log(chalk_1.default.green(PREFIX), log);
    },
    error: function (log) {
        // eslint-disable-next-line no-console
        console.log(chalk_1.default.red(PREFIX), log);
    }
};
