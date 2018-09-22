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
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const botpress_module_sdk_1 = require("botpress-module-sdk");
const realtime_1 = require("botpress-module-sdk/dist/src/realtime");
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const moment_1 = __importDefault(require("moment"));
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const serve_static_1 = __importDefault(require("serve-static"));
const injectScript = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../static/inject.js')).toString();
const injectStyle = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../static/inject.css')).toString();
const ERR_USER_ID_REQ = '`userId` is required and must be valid';
const ERR_MSG_TYPE = '`type` is required and must be valid';
const ERR_CONV_ID_REQ = '`conversationId` is required and must be valid';
exports.default = (bp, db) => __awaiter(this, void 0, void 0, function* () {
    const diskStorage = multer_1.default.diskStorage({
        limits: {
            files: 1,
            fileSize: 5242880 // 5MB
        },
        filename: function (req, file, cb) {
            const userId = lodash_1.default.get(req, 'params.userId') || 'anonymous';
            const ext = path_1.default.extname(file.originalname);
            cb(undefined, `${userId}_${new Date().getTime()}${ext}`);
        }
    });
    const globalConfig = yield bp.config.getModuleConfig('channel-web');
    let upload = multer_1.default({ storage: diskStorage });
    if (globalConfig.uploadsUseS3) {
        /*
          You can override AWS's default settings here. Example:
          { region: 'us-east-1', apiVersion: '2014-10-01', credentials: {...} }
         */
        const awsConfig = {
            region: globalConfig.uploadsS3Region,
            credentials: {
                accessKeyId: globalConfig.uploadsS3AWSAccessKey,
                secretAccessKey: globalConfig.uploadsS3AWSAccessSecret
            }
        };
        if (!awsConfig.credentials.accessKeyId && !awsConfig.credentials.secretAccessKey) {
            delete awsConfig.credentials;
        }
        if (!awsConfig.region) {
            delete awsConfig.region;
        }
        const s3 = new aws_sdk_1.default.S3(awsConfig);
        const s3Storage = multer_s3_1.default({
            s3: s3,
            bucket: globalConfig.uploadsS3Bucket || 'uploads',
            contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
            cacheControl: 'max-age=31536000',
            acl: 'public-read',
            key: function (req, file, cb) {
                const userId = lodash_1.default.get(req, 'params.userId') || 'anonymous';
                const ext = path_1.default.extname(file.originalname);
                cb(undefined, `${userId}_${new Date().getTime()}${ext}`);
            }
        });
        upload = multer_1.default({ storage: s3Storage });
    }
    const router = bp.http.createRouterForBot('channel-web', { checkAuthentication: false, enableJsonBodyParser: true });
    const asyncApi = fn => (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield fn(req, res, next);
        }
        catch (err) {
            bp.logger.error('HTTP Handling Error', err);
            res.status(500).send(err && err.message);
        }
    });
    router.get('/inject.js', (req, res) => {
        res.contentType('text/javascript');
        res.send(injectScript);
    });
    router.get('/inject.css', (req, res) => {
        res.contentType('text/css');
        res.send(injectStyle);
    });
    const staticFolder = path_1.default.join(__dirname /* dist/backend */, '../../static'); // TODO FIXME Fix this, won't work when bundled
    router.use('/static', serve_static_1.default(staticFolder));
    // ?conversationId=xxx (optional)
    router.post('/messages/:userId', asyncApi((req, res) => __awaiter(this, void 0, void 0, function* () {
        const { botId, userId = undefined } = req.params;
        if (!validateUserId(userId)) {
            return res.status(400).send(ERR_USER_ID_REQ);
        }
        yield bp.users.getOrCreateUser('web', userId); // Create the user if it doesn't exist
        const payload = req.body || {};
        let { conversationId = undefined } = req.query || {};
        conversationId = conversationId && parseInt(conversationId);
        if (!lodash_1.default.includes(['text', 'quick_reply', 'form', 'login_prompt', 'visit'], payload.type)) {
            // TODO: Support files
            return res.status(400).send(ERR_MSG_TYPE);
        }
        if (!conversationId) {
            conversationId = yield db.getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage: true });
        }
        yield sendNewMessage(botId, userId, conversationId, payload);
        return res.sendStatus(200);
    })));
    // ?conversationId=xxx (required)
    router.post('/messages/:userId/files', upload.single('file'), asyncApi((req, res) => __awaiter(this, void 0, void 0, function* () {
        const { botId = undefined, userId = undefined } = req.params || {};
        if (!validateUserId(userId)) {
            return res.status(400).send(ERR_USER_ID_REQ);
        }
        yield bp.users.getOrCreateUser('web', userId); // Just to create the user if it doesn't exist
        let { conversationId = undefined } = req.query || {};
        conversationId = conversationId && parseInt(conversationId);
        if (!conversationId) {
            return res.status(400).send(ERR_CONV_ID_REQ);
        }
        const payload = {
            text: `Uploaded a file [${req.file.originalname}]`,
            type: 'file',
            data: {
                storage: req.file.location ? 's3' : 'local',
                url: req.file.location || undefined,
                name: req.file.originalname,
                mime: req.file.contentType || req.file.mimetype,
                size: req.file.size
            }
        };
        yield sendNewMessage(botId, userId, conversationId, payload);
        return res.sendStatus(200);
    })));
    router.get('/conversations/:userId/:conversationId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId, conversationId, botId } = req.params;
        if (!validateUserId(userId)) {
            return res.status(400).send(ERR_USER_ID_REQ);
        }
        const conversation = yield db.getConversation(userId, conversationId, botId);
        return res.send(conversation);
    }));
    router.get('/conversations/:userId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { botId = undefined, userId = undefined } = req.params || {};
        if (!validateUserId(userId)) {
            return res.status(400).send(ERR_USER_ID_REQ);
        }
        yield bp.users.getOrCreateUser('web', userId);
        const conversations = yield db.listConversations(userId, botId);
        const config = yield bp.config.getModuleConfigForBot('channel-web', botId);
        return res.send({
            conversations: [...conversations],
            startNewConvoOnTimeout: config.startNewConvoOnTimeout,
            recentConversationLifetime: config.recentConversationLifetime
        });
    }));
    function validateUserId(userId) {
        return /[a-z0-9-_]+/i.test(userId);
    }
    function sendNewMessage(botId, userId, conversationId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!payload.text || !lodash_1.default.isString(payload.text) || payload.text.length > 360) {
                throw new Error('Text must be a valid string of less than 360 chars');
            }
            const sanitizedPayload = lodash_1.default.pick(payload, ['text', 'type', 'data', 'raw']);
            // let the bot programmer make extra cleanup
            // if (bp.webchat.sanitizeIncomingMessage) {
            // FIXME
            // sanitizedPayload = bp.webchat.sanitizeIncomingMessage(sanitizedPayload) || sanitizedPayload
            // }
            // Because we don't necessarily persist what we emit/received
            const persistedPayload = Object.assign({}, sanitizedPayload);
            // We remove the password from the persisted messages for security reasons
            if (payload.type === 'login_prompt') {
                persistedPayload.data = lodash_1.default.omit(persistedPayload.data, ['password']);
            }
            if (payload.type === 'form') {
                persistedPayload.data.formId = payload.formId;
            }
            const { result: user } = yield bp.users.getOrCreateUser('web', userId);
            const event = new botpress_module_sdk_1.BotpressEvent({
                botId,
                channel: 'web',
                direction: 'incoming',
                payload,
                target: userId,
                threadId: conversationId,
                type: payload.type
            });
            const message = yield db.appendUserMessage(botId, userId, conversationId, persistedPayload);
            bp.realtime.sendPayload(realtime_1.RealTimePayload.forVisitor(userId, 'webchat.message', message));
            return bp.events.sendEvent(event);
        });
    }
    router.post('/events/:userId', asyncApi((req, res) => __awaiter(this, void 0, void 0, function* () {
        const { type = undefined, payload = undefined } = req.body || {};
        const { userId = undefined } = req.params || {};
        const { result: user } = yield bp.users.getOrCreateUser('web', userId);
        bp.events.sendEvent(Object.assign({ channel: 'web', type,
            user, text: payload.text, raw: lodash_1.default.pick(payload, ['text', 'type', 'data']) }, payload.data));
        res.status(200).send({});
    })));
    router.post('/conversations/:userId/:conversationId/reset', asyncApi((req, res) => __awaiter(this, void 0, void 0, function* () {
        const { botId, userId, conversationId } = req.params;
        const { result: user } = yield bp.users.getOrCreateUser('web', userId);
        const payload = {
            text: `Reset the conversation`,
            type: 'session_reset'
        };
        yield sendNewMessage(botId, userId, conversationId, payload);
        yield bp.dialog.deleteSession(userId);
        res.status(200).send({});
    })));
    router.post('/conversations/:userId/new', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId, botId } = req.params;
        yield db.createConversation(botId, userId);
        res.sendStatus(200);
    }));
    router.get('/:userId/reference', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { params: { userId }, query: { ref: webchatUrlQuery } } = req;
            // FIXME
            // const state = await bp.dialogEngine.stateManager.getState(userId)
            // const newState = { ...state, webchatUrlQuery }
            // FIXME
            // await bp.dialogEngine.stateManager.setState(userId, newState)
            res.status(200);
        }
        catch (error) {
            res.status(500);
        }
    }));
    const getMessageContent = message => {
        switch (message.message_type) {
            case 'file':
                return message.message_data.url;
            case 'text':
                return message.message_text;
            default:
                return `Event (${message.message_type})`;
        }
    };
    const convertToTxtFile = (conversation) => __awaiter(this, void 0, void 0, function* () {
        const { messages } = conversation;
        const { result: user } = yield bp.users.getOrCreateUser('web', conversation.userId);
        const timeFormat = 'MM/DD/YY HH:mm';
        const metadata = `Title: ${conversation.title}\r\nCreated on: ${moment_1.default(conversation.created_on).format(timeFormat)}\r\nUser: ${user.attributes.get('first_name')} ${user.attributes.get('last_name')}\r\n-----------------\r\n`;
        const messagesAsTxt = messages.map(message => {
            if (message.message_type === 'session_reset') {
                return '';
            }
            return `[${moment_1.default(message.sent_on).format(timeFormat)}] ${message.full_name}: ${getMessageContent(message)}\r\n`;
        });
        return [metadata, ...messagesAsTxt].join('');
    });
    router.get('/conversations/:userId/:conversationId/download/txt', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId, conversationId, botId } = req.params;
        if (!validateUserId(userId)) {
            return res.status(400).send(ERR_USER_ID_REQ);
        }
        const conversation = yield db.getConversation(userId, conversationId, botId);
        const txt = yield convertToTxtFile(conversation);
        res.send({ txt, name: `${conversation.title}.txt` });
    }));
});
//# sourceMappingURL=api.js.map