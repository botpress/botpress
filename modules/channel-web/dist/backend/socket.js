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
const realtime_1 = require("botpress-module-sdk/dist/src/realtime");
const lodash_1 = __importDefault(require("lodash"));
const mime_1 = __importDefault(require("mime"));
const path_1 = __importDefault(require("path"));
const outgoingTypes = ['text', 'typing', 'login_prompt', 'file', 'carousel', 'custom'];
exports.default = (bp, db) => __awaiter(this, void 0, void 0, function* () {
    const config = {}; // FIXME
    const { botName = 'Bot', botAvatarUrl = undefined } = config || {}; // FIXME
    bp.events.registerMiddleware({
        description: 'Sends out messages that targets platform = webchat.' +
            ' This middleware should be placed at the end as it swallows events once sent.',
        direction: 'outgoing',
        handler: outgoingHandler,
        name: 'web.sendMessages',
        order: 100
    });
    function outgoingHandler(event, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event.channel !== 'web') {
                return next();
            }
            const messageType = event.type === 'default' ? 'text' : event.type;
            const userId = event.target;
            const conversationId = event.threadId || (yield db.getOrCreateRecentConversation(event.botId, userId));
            if (!lodash_1.default.includes(outgoingTypes, messageType)) {
                return next('Unsupported event type: ' + event.type);
            }
            if (messageType === 'typing') {
                const typing = parseTyping(event.payload.value);
                const payload = realtime_1.RealTimePayload.forVisitor(userId, 'webchat.typing', { timeInMs: typing, conversationId });
                // Don't store "typing" in DB
                bp.realtime.sendPayload(payload);
                yield Promise.delay(typing);
            }
            else if (messageType === 'text' || messageType === 'carousel') {
                const message = yield db.appendBotMessage(botName, botAvatarUrl, conversationId, {
                    data: event.payload,
                    raw: event.payload,
                    text: event.preview,
                    type: messageType
                });
                bp.realtime.sendPayload(realtime_1.RealTimePayload.forVisitor(userId, 'webchat.message', message));
            }
            else if (messageType === 'file') {
                const extension = path_1.default.extname(event.payload.url);
                const mimeType = mime_1.default.getType(extension);
                const basename = path_1.default.basename(event.payload.url, extension);
                const message = yield db.appendBotMessage(botName, botAvatarUrl, conversationId, {
                    data: Object.assign({ storage: 'storage', mime: mimeType, name: basename }, event.payload),
                    raw: event.payload,
                    text: event.preview,
                    type: messageType
                });
                bp.realtime.sendPayload(realtime_1.RealTimePayload.forVisitor(userId, 'webchat.message', message));
            }
            else {
                throw new Error(`Message type "${messageType}" not implemented yet`);
            }
            // FIXME Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
        });
    }
});
function parseTyping(typing) {
    if (isNaN(typing)) {
        return 1000;
    }
    return Math.max(typing, 500);
}
//# sourceMappingURL=socket.js.map