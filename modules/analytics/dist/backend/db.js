"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsDatabase = void 0;

var _sdk = require("botpress/sdk");

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TABLE_NAME = 'srv_analytics';

class AnalyticsDatabase {
  constructor(db) {
    this.db = db;
  }

  async insert(args, trx) {
    const {
      botId,
      channel,
      metric,
      value
    } = args;
    let query = this.db(TABLE_NAME).insert({
      botId,
      channel,
      metric_name: metric,
      value,
      created_on: this.db.date.now()
    });

    if (trx) {
      query = query.transacting(trx);
    }

    return query;
  }

  async update(id, value, trx) {
    let query = this.db(TABLE_NAME).update({
      value,
      updated_on: this.db.date.now()
    }).where({
      id
    });

    if (trx) {
      query = query.transacting(trx);
    }

    return query;
  }

  async insertOrUpdate(def, trx) {
    const {
      botId,
      channel,
      metric
    } = def;
    const value = def.increment || 1;
    const analytics = await this.get({
      botId,
      channel,
      metric
    }, trx);

    if (!analytics) {
      return this.insert({
        botId,
        channel,
        metric,
        value: value
      }, trx);
    } // Aggregate metrics per day


    const latest = (0, _moment.default)(analytics.created_on).startOf('day');
    const today = (0, _moment.default)().startOf('day');

    if (latest.isBefore(today) && def.method === _sdk.AnalyticsMethod.IncrementDaily) {
      return this.insert({
        botId,
        channel,
        metric,
        value
      }, trx);
    } else if (latest.isBefore(today) && def.method === _sdk.AnalyticsMethod.IncrementTotal) {
      return this.insert({
        botId,
        channel,
        metric,
        value: analytics.value + value
      }, trx);
    } else if (latest.isBefore(today) && def.method === _sdk.AnalyticsMethod.Replace) {
      return this.insert({
        botId,
        channel,
        metric,
        value
      }, trx);
    } else if (def.method === _sdk.AnalyticsMethod.Replace) {
      return this.update(analytics.id, value, trx);
    } else {
      return this.update(analytics.id, analytics.value + value, trx);
    }
  }

  async insertMany(metricDefs) {
    const trx = await this.db.transaction();

    try {
      await Promise.mapSeries(metricDefs, def => this.insertOrUpdate(def, trx));
      await trx.commit();
    } catch (err) {
      await trx.rollback(err);
    }
  }

  async get(args, trx) {
    const {
      botId,
      channel,
      metric
    } = args;
    let query = this.db(TABLE_NAME).select().where({
      botId,
      channel,
      metric_name: metric
    }).orderBy('created_on', 'desc').first();

    if (trx) {
      query = query.transacting(trx);
    }

    return query;
  }

  async getBetweenDates(botId, startDate, endDate, channel) {
    const includeEndDate = (0, _moment.default)(endDate).add(1, 'day');
    let query = this.db(TABLE_NAME).select().whereBetween('created_on', [startDate.toISOString(), includeEndDate.toISOString()]).andWhere({
      botId
    });

    if (channel) {
      query = query.andWhere({
        channel
      });
    }

    return query;
  }

}

exports.AnalyticsDatabase = AnalyticsDatabase;
//# sourceMappingURL=db.js.map