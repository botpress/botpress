"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.APP_PREFIX = exports.getAppDataPath = exports.getReleasedFiles = void 0;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const cli_1 = require("./cli");
const getReleasedFiles = async (toolName, platform) => {
    try {
        const platformMatch = new RegExp(`.*-(${platform.replace('win32', 'win')})-x64`);
        const { data } = await axios_1.default.get(cli_1.toolsList[toolName].url);
        const files = data.map(x => {
            const platformFile = x.assets.find(asset => platformMatch.test(asset.name));
            return {
                version: x.tag_name,
                fileName: (platformFile === null || platformFile === void 0 ? void 0 : platformFile.name) || '',
                fileSize: (platformFile === null || platformFile === void 0 ? void 0 : platformFile.size) || -1,
                downloadUrl: (platformFile === null || platformFile === void 0 ? void 0 : platformFile.browser_download_url) || ''
            };
        });
        return files.filter(x => x.fileName);
    }
    catch (err) {
        exports.logger.error(err);
        return [];
    }
};
exports.getReleasedFiles = getReleasedFiles;
const getAppDataPath = () => {
    const homeDir = process.env.HOME || process.env.APPDATA;
    if (homeDir) {
        if (process.platform === 'darwin') {
            return path_1.default.join(homeDir, 'Library', 'Application Support', 'botpress');
        }
        return path_1.default.join(homeDir, 'botpress');
    }
    exports.logger.error(chalk_1.default.red(`Could not determine your HOME directory.
Please set the environment variable "APP_DATA_PATH", then start Botpress`));
    process.exit();
};
exports.getAppDataPath = getAppDataPath;
exports.APP_PREFIX = '[BP Downloader]';
exports.logger = {
    info: (log) => {
        console.info(chalk_1.default.green(exports.APP_PREFIX), log);
    },
    error: (log) => {
        console.error(chalk_1.default.red(exports.APP_PREFIX), log);
    }
};
//# sourceMappingURL=utils.js.map