"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bluebird_1 = __importDefault(require("bluebird"));
var cli_progress_1 = __importDefault(require("cli-progress"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var mkdirp_1 = __importDefault(require("mkdirp"));
var path_1 = __importDefault(require("path"));
var download_1 = require("./download");
var errors_1 = require("./errors");
var logger_1 = __importDefault(require("./logger"));
var semver_1 = require("./semver");
var FILE_PATTERNS = {
    win32: /nlu-v(\d+_\d+_\d+)-win-x64\.exe/,
    darwin: /nlu-v(\d+_\d+_\d+)-darwin-x64/,
    linux: /nlu-v(\d+_\d+_\d+)-linux-x64/
};
var makeFileNamePerOS = function (version) {
    var versionUnderscore = semver_1.dotsToUnderscores(version);
    return {
        win32: "nlu-v" + versionUnderscore + "-win-x64.exe",
        darwin: "nlu-v" + versionUnderscore + "-darwin-x64",
        linux: "nlu-v" + versionUnderscore + "-linux-x64"
    };
};
var scanAndRemoveInvalidVersion = function (platform, outputDir, version) { return __awaiter(void 0, void 0, void 0, function () {
    var binRegex, wrongVersionBinaries;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                binRegex = FILE_PATTERNS[platform];
                if (!binRegex) {
                    throw new errors_1.UnsuportedOSError(platform);
                }
                return [4 /*yield*/, fs_extra_1.default.readdir(outputDir)];
            case 1:
                wrongVersionBinaries = (_a.sent()).filter(function (f) {
                    var wholeMatch = binRegex.exec(f);
                    return wholeMatch && wholeMatch[1] && semver_1.underscoresToDots(wholeMatch[1]) !== version;
                });
                if (!wrongVersionBinaries.length) {
                    return [2 /*return*/];
                }
                logger_1.default.info("About to prune the following binaries as the target version is " + version + ": [" + wrongVersionBinaries.join(', ') + "]");
                return [2 /*return*/, bluebird_1.default.map(wrongVersionBinaries.map(function (f) { return path_1.default.join(outputDir, f); }), function (f) { return fs_extra_1.default.unlink(f); })];
        }
    });
}); };
exports.default = (function (argv) { return __awaiter(void 0, void 0, void 0, function () {
    var configFileExists, nlu, fileContent, parsedContent, err_1, version, downloadURL, fileName, fileDownloadURL, destination, destinationFileExists, downloadProgressBar;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                configFileExists = fs_extra_1.default.existsSync(argv.config);
                if (!configFileExists) {
                    throw new Error("File " + argv.config + " does not exist.");
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs_extra_1.default.readFile(argv.config, 'utf8')];
            case 2:
                fileContent = _a.sent();
                parsedContent = JSON.parse(fileContent);
                nlu = parsedContent.nlu;
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                throw new Error("An error occured while parsing config file: " + err_1.message);
            case 4:
                if (!nlu) {
                    throw new Error("The config file " + argv.config + " has no field \"nlu\"");
                }
                version = nlu.version, downloadURL = nlu.downloadURL;
                fileName = makeFileNamePerOS(version)[argv.platform];
                if (!fileName) {
                    throw new errors_1.UnsuportedOSError(argv.platform);
                }
                mkdirp_1.default.sync(argv.output);
                return [4 /*yield*/, scanAndRemoveInvalidVersion(argv.platform, argv.output, version)];
            case 5:
                _a.sent();
                fileDownloadURL = downloadURL + "/" + fileName;
                destination = path_1.default.join(argv.output, fileName);
                destinationFileExists = fs_extra_1.default.existsSync(destination);
                if (!(destinationFileExists && !argv.force)) return [3 /*break*/, 6];
                logger_1.default.info('binary executable file up to date. Nothing to download.');
                return [2 /*return*/];
            case 6:
                if (!(destinationFileExists && argv.force)) return [3 /*break*/, 8];
                logger_1.default.info('Overwriting currently installed binary.');
                return [4 /*yield*/, fs_extra_1.default.unlink(destination)];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                logger_1.default.info("About to download from " + fileDownloadURL);
                logger_1.default.info("Output file is " + destination);
                downloadProgressBar = new cli_progress_1.default.Bar({
                    format: 'NLU binary executable Download: [{bar}] ({percentage}%), {duration}s',
                    stream: process.stdout,
                    noTTYOutput: true
                });
                downloadProgressBar.start(100, 0);
                _a.label = 9;
            case 9:
                _a.trys.push([9, , 12, 13]);
                return [4 /*yield*/, download_1.downloadBin(fileDownloadURL, destination, function (p) {
                        downloadProgressBar.update(p * 100);
                    })];
            case 10:
                _a.sent();
                downloadProgressBar.update(100);
                return [4 /*yield*/, fs_extra_1.default.chmod(destination, '766')]; // user: rwx, group: rw, others: rw
            case 11:
                _a.sent(); // user: rwx, group: rw, others: rw
                return [3 /*break*/, 13];
            case 12:
                downloadProgressBar.stop();
                return [7 /*endfinally*/];
            case 13: return [2 /*return*/];
        }
    });
}); });
