"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("bluebird-global");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("./api"));
const db_1 = __importDefault(require("./db"));
const socket_1 = __importDefault(require("./socket"));
exports.onInit = (bp) => __awaiter(this, void 0, void 0, function* () {
    bp['channel-web'] = {};
    const db = new db_1.default(bp);
    yield db.initialize();
    yield api_1.default(bp, db);
    yield socket_1.default(bp, db);
});
exports.onReady = (bp) => __awaiter(this, void 0, void 0, function* () { });
exports.config = {
    uploadsUseS3: { type: 'bool', required: false, default: false, env: 'CHANNEL_WEB_USE_S3' },
    uploadsS3Bucket: { type: 'string', required: false, default: 'bucket-name', env: 'CHANNEL_WEB_S3_BUCKET' },
    uploadsS3AWSAccessKey: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_ACCESS_KEY' },
    uploadsS3Region: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_REGION' },
    uploadsS3AWSAccessSecret: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_KEY_SECRET' },
    startNewConvoOnTimeout: {
        type: 'bool',
        required: false,
        default: false,
        env: 'CHANNEL_WEB_START_NEW_CONVO_ON_TIMEOUT'
    },
    recentConversationLifetime: {
        type: 'any',
        required: false,
        default: '6 hours',
        env: 'CHANNEL_WEB_RECENT_CONVERSATION_LIFETIME'
    }
};
exports.defaultConfigJson = `
{
  /************
    Optional settings
  *************/

  "uploadsUseS3": false,
  "uploadsS3Bucket": "bucket-name",
  "uploadsS3Region": "eu-west-1",
  "uploadsS3AWSAccessKey": "your-aws-key-name",
  "uploadsS3AWSAccessSecret": "secret-key",
  "startNewConvoOnTimeout": false,
  "recentConversationLifetime": "6 hours"
}
`;
exports.serveFile = (filePath) => __awaiter(this, void 0, void 0, function* () {
    filePath = filePath.toLowerCase();
    const mapping = {
        'index.js': path_1.default.join(__dirname, '../web/web.bundle.js'),
        'embedded.js': path_1.default.join(__dirname, '../web/embedded.bundle.js'),
        'fullscreen.js': path_1.default.join(__dirname, '../web/fullscreen.bundle.js')
    };
    // Web views
    if (mapping[filePath]) {
        return fs_1.default.readFileSync(mapping[filePath]);
    }
    return new Buffer('');
});
//# sourceMappingURL=index.js.map