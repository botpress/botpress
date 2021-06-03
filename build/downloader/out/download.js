"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const downloadFile = async (url, destinationFile, progress) => {
    const { data, headers } = await axios_1.default.get(url, { responseType: 'stream' });
    const tmpPath = destinationFile + '.tmp';
    const stream = data;
    const fileSize = parseInt(headers['content-length']);
    let downloadedSize = 0;
    await fs_extra_1.default.createFile(tmpPath);
    stream.pipe(fs_extra_1.default.createWriteStream(tmpPath));
    return new Promise((resolve, reject) => {
        stream.on('error', err => {
            fs_extra_1.default.unlink(tmpPath, () => {
                reject(new Error(`file download failed with error: ${err.message}`));
            });
        });
        stream.on('data', chunk => {
            downloadedSize += chunk.length;
            progress(downloadedSize / fileSize);
        });
        stream.on('end', () => {
            fs_extra_1.default.rename(tmpPath, destinationFile, err => {
                if (err) {
                    reject(err);
                }
                resolve(undefined);
            });
        });
    });
};
exports.downloadFile = downloadFile;
//# sourceMappingURL=download.js.map