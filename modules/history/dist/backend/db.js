"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const FLAGS_TABLE_NAME = 'history_flags';
const EVENTS_TABLE_NAME = 'events';

class HistoryDb {
  constructor(bp) {
    this.bp = bp;

    _defineProperty(this, "knex", void 0);

    _defineProperty(this, "initialize", async () => {
      this.knex.createTableIfNotExists(FLAGS_TABLE_NAME, table => {
        table.string('flaggedMessageId').primary();
      });
    });

    _defineProperty(this, "flagMessages", async messageIds => {
      const existingRows = await this.knex.select().from(FLAGS_TABLE_NAME).whereIn('flaggedMessageId', messageIds).then(rows => rows.map(r => r.flaggedMessageId));
      const newRows = messageIds.filter(msgId => !existingRows.includes(msgId)).map(msgId => ({
        flaggedMessageId: msgId
      }));
      await this.knex.batchInsert(FLAGS_TABLE_NAME, newRows, 30);
    });

    _defineProperty(this, "unflagMessages", async messages => {
      await this.knex.del().from(FLAGS_TABLE_NAME).whereIn('flaggedMessageId', messages.map(m => m.userMessage.id));
    });

    _defineProperty(this, "getMessagesOfConversation", async (sessionId, count, offset, filters) => {
      const incomingMessagesQuery = this.knex.select('event', 'flaggedMessageId').from(EVENTS_TABLE_NAME).leftJoin(FLAGS_TABLE_NAME, `${EVENTS_TABLE_NAME}.incomingEventId`, `${FLAGS_TABLE_NAME}.flaggedMessageId`).orderBy('createdOn', 'desc').where({
        sessionId,
        direction: 'incoming'
      });

      if (filters && filters.flag) {
        incomingMessagesQuery.whereNotNull(`${FLAGS_TABLE_NAME}.flaggedMessageId`);
      }

      const incomingMessageRows = await incomingMessagesQuery.offset(offset).limit(count);
      const messageGroupsMap = {};

      _lodash.default.forEach(incomingMessageRows, r => {
        const userMessage = this.knex.json.get(r.event);
        messageGroupsMap[userMessage.id] = {
          isFlagged: !!r.flaggedMessageId,
          userMessage,
          botMessages: []
        };
      });

      const outgoingMessagesRows = await this.knex(EVENTS_TABLE_NAME).whereIn('incomingEventId', _lodash.default.keys(messageGroupsMap)).andWhere({
        direction: 'outgoing'
      });

      _lodash.default.forEach(outgoingMessagesRows, r => {
        messageGroupsMap[r.incomingEventId].botMessages.push(this.knex.json.get(r.event));
      });

      const messageGroups = _lodash.default.values(messageGroupsMap);

      return _lodash.default.sortBy(messageGroups, mg => (0, _moment.default)(mg.userMessage.createdOn).unix()).reverse();
    });

    _defineProperty(this, "getConversationMessageGroupCount", async (sessionId, filters) => {
      return this._getMessageCountWhere({
        sessionId,
        direction: 'incoming'
      }, filters);
    });

    this.knex = bp.database;
  }

  async getDistinctConversations(botId, from, to) {
    const query = this.knex.select().distinct('sessionId').from(EVENTS_TABLE_NAME).whereNotNull('sessionId').andWhere({
      botId
    }).andWhereNot('sessionId', 'like', '%benchmark%'); // Those are users created when benchmarking performances

    if (from) {
      const fromDate = _moment.default.unix(from).toDate();

      query.andWhere(this.knex.date.isBefore(fromDate, 'createdOn'));
    }

    if (to) {
      const toDate = _moment.default.unix(to).toDate();

      query.andWhere(this.knex.date.isAfter(toDate, 'createdOn'));
    }

    const queryResults = await query;
    const uniqueConversations = queryResults.map(x => x.sessionId);
    return uniqueConversations;
  }

  async getConversationMessageCount(sessionId) {
    return this._getMessageCountWhere({
      sessionId
    });
  }

  async _getMessageCountWhere(whereParams, filters) {
    const messageCountQuery = this.knex.from(EVENTS_TABLE_NAME).leftJoin(FLAGS_TABLE_NAME, `${EVENTS_TABLE_NAME}.incomingEventId`, `${FLAGS_TABLE_NAME}.flaggedMessageId`);

    if (filters && filters.flag) {
      messageCountQuery.whereNotNull(`${FLAGS_TABLE_NAME}.flaggedMessageId`);
    }

    const messageCountObject = await messageCountQuery.count().where(whereParams);
    return messageCountObject.pop()['count(*)'];
  }

}

exports.default = HistoryDb;
//# sourceMappingURL=db.js.map