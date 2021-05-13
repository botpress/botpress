"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = __importDefault(require("os"));
var yargs_1 = __importDefault(require("yargs"));
var installer_1 = __importDefault(require("./installer"));
var logger_1 = __importDefault(require("./logger"));
yargs_1.default
    .command(['install', '$0'], 'Install NLU Server binary at the desired location', {
    config: {
        alias: 'c',
        description: 'Path to your config file',
        type: 'string',
        demandOption: true
    },
    output: {
        alias: 'o',
        description: 'Directory where to install the file',
        type: 'string',
        demandOption: true
    },
    platform: {
        alias: 'p',
        choices: ['darwin', 'linux', 'win32'],
        default: os_1.default.platform()
    },
    force: {
        alias: 'f',
        type: 'boolean',
        default: false
    }
}, function (argv) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    installer_1.default(argv)
        .then(function () { })
        .catch(function (err) {
        logger_1.default.error("The following error occured: [" + err.message + "]");
    });
})
    .help().argv;
