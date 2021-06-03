"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const cli_1 = require("./cli");
const utils_1 = require("./utils");
const getCommonArgv = (argv) => {
    const { appData, platform, output } = argv;
    return { appData, platform, output };
};
yargs_1.default
    .options({
    appData: {
        description: 'Change the location where binaries are stored',
        alias: 'a',
        type: 'string',
        default: process.env.APP_DATA_PATH || utils_1.getAppDataPath()
    },
    platform: {
        alias: 'p',
        choices: ['darwin', 'linux', 'win32'],
        default: os_1.default.platform()
    },
    output: {
        alias: 'o',
        description: 'Choose a different output location',
        default: path_1.default.resolve(__dirname, '../../../out/bp')
    }
})
    .command(['list', '$0'], 'List available and installed versions of a tool', {}, async (argv) => {
    await cli_1.listFiles(getCommonArgv(argv));
})
    .command(['init'], "Installs the version configured on the project's package.json file", {
    config: {
        alias: 'c',
        description: 'Path to the package.json file',
        default: path_1.default.resolve(__dirname, '../../../package.json')
    }
}, async (argv) => {
    await cli_1.initProject(argv.config, getCommonArgv(argv));
})
    .command(['install <toolName> [toolVersion]'], 'Install a different version of a tool. Omit the version to get the latest one', {}, async (argv) => {
    yargs_1.default
        .positional('toolName', {
        describe: 'Name of the tool to install',
        type: 'string'
    })
        .positional('toolVersion', {
        describe: 'When ommitted, the latest version is installed',
        type: 'string'
    });
    await cli_1.installFile(argv.toolName, getCommonArgv(argv), argv.toolVersion);
})
    .command(['clean'], 'Remove all versions of all tools', {}, async (argv) => {
    await cli_1.cleanFiles(argv.appData);
})
    .command(['use <toolName> <toolVersion>'], 'Use the specified version of a tool on the current workspace', {}, async (argv) => {
    yargs_1.default
        .positional('toolName', {
        describe: 'Name of the tool to use',
        type: 'string'
    })
        .positional('toolVersion', {
        type: 'string'
    });
    await cli_1.useFile(argv.toolName, argv.toolVersion, getCommonArgv(argv));
})
    .help().argv;
//# sourceMappingURL=index.js.map