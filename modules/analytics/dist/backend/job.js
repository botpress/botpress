"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sdk = require("botpress/sdk");

var _lodash = _interopRequireDefault(require("lodash"));

var _ms = _interopRequireDefault(require("ms"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class AnalyticsService {
  constructor(bp, db) {
    this.bp = bp;
    this.db = db;

    _defineProperty(this, "BATCH_SIZE", 100);

    _defineProperty(this, "batch", []);

    _defineProperty(this, "botConfigs", new Map());

    _defineProperty(this, "enabled", false);

    _defineProperty(this, "interval", void 0);

    _defineProperty(this, "intervalRef", void 0);

    _defineProperty(this, "currentPromise", void 0);

    _defineProperty(this, "_runTask", async () => {
      const todaysEvents = await this.bp.events.findByDate(new Date());
      await this.compileFeedbackMetrics(todaysEvents);
      await this.compileUsersCountMetric(todaysEvents);

      if (this.currentPromise || !this.batch.length) {
        return;
      }

      const batchSize = Math.min(this.batch.length, this.BATCH_SIZE);
      const metrics = this.batch.splice(0, batchSize);
      this.currentPromise = this.db.insertMany(metrics).catch(err => {
        this.bp.logger.attachError(err).error('Could not persist metrics. Re-queuing now.');
        this.batch.push(...metrics);
      }).finally(() => {
        this.currentPromise = undefined;
      });
    });
  }

  async initialize() {
    const config = (await this.bp.config.getModuleConfig('analytics')).analytics;

    if (!config || !config.enabled) {
      return;
    }

    this.interval = (0, _ms.default)(config.interval);
    this.enabled = config.enabled;
  }

  start() {
    if (this.intervalRef || !this.enabled) {
      return;
    }

    this.intervalRef = setInterval(this._runTask, this.interval);
  }

  async addMetric(metricDef) {
    var _this$botConfigs$get, _this$botConfigs$get$;

    if (!this.botConfigs.has(metricDef.botId)) {
      const botConfig = await this.bp.config.getModuleConfigForBot('analytics', metricDef.botId);
      this.botConfigs.set(metricDef.botId, botConfig);
    }

    if (this.enabled || ((_this$botConfigs$get = this.botConfigs.get(metricDef.botId)) === null || _this$botConfigs$get === void 0 ? void 0 : (_this$botConfigs$get$ = _this$botConfigs$get.analytics) === null || _this$botConfigs$get$ === void 0 ? void 0 : _this$botConfigs$get$.enabled)) {
      this.batch.push(metricDef);
    }
  }

  async addUserMetric(botId, channel) {
    await this.addMetric({
      botId,
      channel,
      metric: _sdk.AnalyticsMetric.NewUsersCount,
      method: _sdk.AnalyticsMethod.IncrementDaily
    });
    await this.addMetric({
      botId,
      channel,
      metric: _sdk.AnalyticsMetric.TotalUsers,
      method: _sdk.AnalyticsMethod.IncrementTotal
    });
  }

  async getDateRange(botId, startDate, endDate, channel) {
    return this.db.getBetweenDates(botId, startDate, endDate, channel);
  }

  async setQnaFeedbackCount(botId, channel, feedback, count) {
    const metric = feedback > 0 ? _sdk.AnalyticsMetric.FeedbackPositiveQna : _sdk.AnalyticsMetric.FeedbackNegativeQna;
    return this.addMetric({
      botId,
      channel,
      metric,
      method: _sdk.AnalyticsMethod.Replace,
      increment: count
    });
  }

  async setGoalFeedbackCount(botId, channel, feedback, count) {
    const metric = feedback > 0 ? _sdk.AnalyticsMetric.FeedbackPositiveGoal : _sdk.AnalyticsMetric.FeedbackNegativeGoal;
    return this.addMetric({
      botId,
      channel,
      metric,
      method: _sdk.AnalyticsMethod.Replace,
      increment: count
    });
  }

  async compileFeedbackMetrics(events) {
    const incomingEvents = events.filter(e => e.direction === 'incoming');

    _lodash.default.chain(incomingEvents).filter(e => !e.goalId && e.feedback).groupBy(e => `${e.botId}-${e.channel}-${e.feedback}`).forEach(async (value, _) => await this.setQnaFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)).value();

    _lodash.default.chain(incomingEvents).filter(e => e.goalId && e.feedback).groupBy(e => `${e.botId}-${e.channel}-${e.feedback}`).forEach(async (value, _) => await this.setGoalFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)).value();
  }

  async compileUsersCountMetric(events) {
    _lodash.default.chain(events).groupBy(e => `${e.botId}-${e.channel}-${e.target}`).forEach(async (value, _) => {
      await this.addMetric({
        botId: value[0]['botId'],
        channel: value[0]['channel'],
        metric: _sdk.AnalyticsMetric.ActiveUsers,
        method: _sdk.AnalyticsMethod.Replace
      });
    }).value();
  }

}

exports.default = AnalyticsService;
//# sourceMappingURL=job.js.map