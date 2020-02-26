"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _moment = _interopRequireDefault(require("moment"));

var _ms = _interopRequireDefault(require("ms"));

var _customAnalytics = _interopRequireDefault(require("./custom-analytics"));

var _stats = _interopRequireDefault(require("./stats"));

var _task = require("./task");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Analytics {
  constructor(bp, botId) {
    this.bp = bp;
    this.botId = botId;

    _defineProperty(this, "_knex", void 0);

    _defineProperty(this, "_stats", void 0);

    _defineProperty(this, "_task", void 0);

    _defineProperty(this, "custom", void 0);

    this._knex = bp['database'];
    this._stats = new _stats.default(this._knex);
    this._task = new _task.UpdateTask(this.bp, this._getInterval());
    this.custom = (0, _customAnalytics.default)({
      bp,
      botId
    });
  }

  async start() {
    this._task.runTask = async () => {
      await this._updateData();
    };

    await this._task.start(this.botId);
  }

  async stop() {
    await this._task.stop(this.botId);
  }

  async getAnalyticsMetadata() {
    const timestamp = await this._stats.getLastRun();
    const lastRun = (0, _moment.default)(timestamp);

    const elasped = _moment.default.duration((0, _moment.default)().diff(lastRun)).humanize();

    return {
      lastUpdated: elasped,
      size: this._getDBSize()
    };
  }

  async _updateData() {
    const totalUsers = await this._stats.getTotalUsers();
    const activeUsers = await this._stats.getDailyActiveUsers();
    const interactionsRange = await this._stats.getInteractionRanges();
    const avgInteractions = await this._stats.getAverageInteractions();
    const nbUsers = await this._stats.getNumberOfUsers();
    const rentention = await this._stats.usersRetention();
    const busyHours = await this._stats.getBusyHours();
    await this._savePartialData(this.botId, 'analytics', {
      totalUsers: totalUsers || 0,
      activeUsers,
      interactionsRange: interactionsRange,
      fictiveSpecificMetrics: {
        numberOfInteractionInAverage: avgInteractions,
        numberOfUsersToday: nbUsers.today,
        numberOfUsersYesterday: nbUsers.yesterday,
        numberOfUsersThisWeek: nbUsers.week
      },
      retentionHeatMap: rentention,
      busyHoursHeatMap: busyHours
    });
    await this._stats.setLastRun();
  }

  async getChartsGraphData() {
    const analytics = await this.bp.kvs.get(this.botId, 'analytics');

    if (!analytics) {
      return {};
    }

    return {
      loading: false,
      noData: false,
      totalUsersChartData: analytics['totalUsers'] || [],
      activeUsersChartData: analytics['activeUsers'] || [],
      genderUsageChartData: analytics['genderUsage'] || [],
      typicalConversationLengthInADay: analytics['interactionsRange'] || [],
      specificMetricsForLastDays: analytics['fictiveSpecificMetrics'] || {},
      retentionHeatMap: analytics['retentionHeatMap'] || [],
      busyHoursHeatMap: analytics['busyHoursHeatMap'] || []
    };
  }

  _getDBSize() {
    if (this.bp.database.isLite) {
      return _fs.default.statSync(this.bp.database.location)['size'] / 1000000.0; // in megabytes
    } else {
      return 1;
    }
  }

  _getInterval() {
    return this._getDBSize() < 5 ? (0, _ms.default)('5m') : (0, _ms.default)('1h');
  }

  async _savePartialData(botId, property, data) {
    await this.bp.kvs.set(botId, property, data);
  }

}

exports.default = Analytics;
//# sourceMappingURL=analytics.js.map