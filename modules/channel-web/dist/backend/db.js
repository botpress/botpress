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
const bluebird_1 = __importDefault(require("bluebird"));
const lodash_1 = __importDefault(require("lodash"));
const moment_1 = __importDefault(require("moment"));
const ms_1 = __importDefault(require("ms"));
const uuid_1 = __importDefault(require("uuid"));
class WebchatDb {
    constructor(bp) {
        this.bp = bp;
        this.users = bp.users;
        this.knex = bp.database;
    }
    getUserInfo(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { result: user } = yield this.users.getOrCreateUser('web', userId);
            const fullName = `${user.attributes.get('first_name')} ${user.attributes.get('last_name')}`;
            const avatar = (user && user.attributes.get('picture_url')) || undefined;
            return {
                fullName,
                avatar_url: avatar
            };
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.knex
                .createTableIfNotExists('web_conversations', function (table) {
                table.increments('id').primary();
                table.string('userId');
                table.integer('botId');
                table.string('title');
                table.string('description');
                table.string('logo_url');
                table.timestamp('created_on');
                table.timestamp('last_heard_on'); // The last time the user interacted with the bot. Used for "recent" conversation
                table.timestamp('user_last_seen_on');
                table.timestamp('bot_last_seen_on');
            })
                .then(() => {
                return this.knex.createTableIfNotExists('web_messages', function (table) {
                    table.string('id').primary();
                    table.integer('conversationId');
                    table.string('userId');
                    table.string('message_type');
                    table.text('message_text');
                    table.jsonb('message_raw');
                    table.binary('message_data'); // Only useful if type = file
                    table.string('full_name');
                    table.string('avatar_url');
                    table.timestamp('sent_on');
                });
            });
        });
    }
    appendUserMessage(botId, userId, conversationId, { type, text, raw, data }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fullName, avatar_url } = yield this.getUserInfo(userId);
            const convo = yield this.knex('web_conversations')
                .where({ userId, id: conversationId, botId })
                .select('id')
                .limit(1)
                .then()
                .get(0);
            if (!convo) {
                throw new Error(`Conversation "${conversationId}" not found`);
            }
            const message = {
                id: uuid_1.default.v4(),
                conversationId,
                userId,
                full_name: fullName,
                avatar_url,
                message_type: type,
                message_text: text,
                message_raw: this.knex.json.set(raw),
                message_data: this.knex.json.set(data),
                sent_on: this.knex.date.now()
            };
            return bluebird_1.default.join(this.knex('web_messages')
                .insert(message)
                .then(), this.knex('web_conversations')
                .where({ id: conversationId, userId: userId, botId: botId })
                .update({ last_heard_on: this.knex.date.now() })
                .then(), () => (Object.assign({}, message, { sent_on: new Date(), message_raw: raw, message_data: data })));
        });
    }
    appendBotMessage(botName, botAvatar, conversationId, { type, text, raw, data }) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                id: uuid_1.default.v4(),
                conversationId: conversationId,
                userId: undefined,
                full_name: botName,
                avatar_url: botAvatar,
                message_type: type,
                message_text: text,
                message_raw: this.knex.json.set(raw),
                message_data: this.knex.json.set(data),
                sent_on: this.knex.date.now()
            };
            yield this.knex('web_messages')
                .insert(message)
                .then();
            return Object.assign(message, {
                sent_on: new Date(),
                message_raw: this.knex.json.get(message.message_raw),
                message_data: this.knex.json.get(message.message_data)
            });
        });
    }
    createConversation(botId, userId, { originatesFromUserMessage = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const uid = Math.random()
                .toString()
                .substr(2, 6);
            const title = `Conversation ${uid}`;
            yield this.knex('web_conversations')
                .insert({
                botId,
                userId,
                created_on: this.knex.date.now(),
                last_heard_on: originatesFromUserMessage ? this.knex.date.now() : undefined,
                title
            })
                .then();
            const conversation = yield this.knex('web_conversations')
                .where({ title, userId, botId })
                .select('id')
                .then()
                .get(0);
            return conversation && conversation.id;
        });
    }
    getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Lifetime config by bot
            const config = yield this.bp.config.getModuleConfigForBot('channel-web', botId);
            const recentCondition = this.knex.date.isAfter('last_heard_on', moment_1.default()
                .subtract(ms_1.default(config.recentConversationLifetime), 'ms')
                .toDate());
            const conversation = yield this.knex('web_conversations')
                .select('id')
                .whereNotNull('last_heard_on')
                .andWhere({ userId, botId })
                .andWhere(recentCondition)
                .orderBy('last_heard_on', 'desc')
                .limit(1)
                .then()
                .get(0);
            return conversation ? conversation.id : this.createConversation(botId, userId, { originatesFromUserMessage });
        });
    }
    listConversations(userId, botId) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversations = (yield this.knex('web_conversations')
                .select('id')
                .where({ userId, botId })
                .orderBy('last_heard_on', 'desc')
                .limit(100)
                .then());
            const conversationIds = conversations.map(c => c.id);
            let lastMessages = this.knex
                .from('web_messages')
                .distinct(this.knex.raw('ON ("conversationId") *'))
                .orderBy('conversationId')
                .orderBy('sent_on', 'desc');
            if (this.knex.isLite) {
                const lastMessagesDate = this.knex('web_messages')
                    .whereIn('conversationId', conversationIds)
                    .groupBy('conversationId')
                    .select(this.knex.raw('max(sent_on) as date'));
                lastMessages = this.knex
                    .from('web_messages')
                    .select('*')
                    .whereIn('sent_on', lastMessagesDate);
            }
            return this.knex
                .from(function () {
                this.from('web_conversations')
                    .where({ userId, botId })
                    .as('wc');
            })
                .leftJoin(lastMessages.as('wm'), 'wm.conversationId', 'wc.id')
                .orderBy('wm.sent_on', 'desc')
                .select('wc.id', 'wc.title', 'wc.description', 'wc.logo_url', 'wc.created_on', 'wc.last_heard_on', 'wm.message_type', 'wm.message_text', this.knex.raw('wm.full_name as message_author'), this.knex.raw('wm.avatar_url as message_author_avatar'), this.knex.raw('wm.sent_on as message_sent_on'));
        });
    }
    getConversation(userId, conversationId, botId) {
        return __awaiter(this, void 0, void 0, function* () {
            const condition = { userId, botId };
            if (conversationId && conversationId !== 'null') {
                condition.id = conversationId;
            }
            const conversation = yield this.knex('web_conversations')
                .where(condition)
                .then()
                .get(0);
            if (!conversation) {
                return undefined;
            }
            const messages = yield this.getConversationMessages(conversationId);
            messages.forEach(m => {
                return Object.assign(m, {
                    message_raw: this.knex.json.get(m.message_raw),
                    message_data: this.knex.json.get(m.message_data)
                });
            });
            return Object.assign({}, conversation, {
                messages: lodash_1.default.orderBy(messages, ['sent_on'], ['asc'])
            });
        });
    }
    getConversationMessages(conversationId, fromId) {
        let query = this.knex('web_messages').where({ conversationId: conversationId });
        if (fromId) {
            query = query.andWhere('id', '<', fromId);
        }
        return query
            .orderBy('sent_on', 'desc')
            .limit(20)
            .then();
    }
}
exports.default = WebchatDb;
//# sourceMappingURL=db.js.map