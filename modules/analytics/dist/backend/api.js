"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sdk = require("botpress/sdk");

var _lodash = _interopRequireDefault(require("lodash"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = db => {
  const router = _sdk.http.createRouterForBot('analytics', {
    checkAuthentication: true,
    enableJsonBodyParser: true
  });

  router.get('/channel/:channel', async (req, res) => {
    const {
      botId,
      channel
    } = req.params;
    const {
      start,
      end
    } = req.query;
    const startDate = unixToDate(start);
    const endDate = unixToDate(end);

    try {
      if (!channel || channel === 'all') {
        const analytics = await db.getBetweenDates(botId, startDate, endDate, undefined);
        res.send(analytics.map(toDto));
      } else {
        const analytics = await db.getBetweenDates(botId, startDate, endDate, channel);
        res.send(analytics.map(toDto));
      }
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  const toDto = analytics => {
    return _lodash.default.pick(analytics, ['metric_name', 'value', 'created_on', 'channel']);
  };

  const unixToDate = unix => {
    const momentDate = _moment.default.unix(unix);

    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`);
    }

    return momentDate.toDate();
  };
};

exports.default = _default;
//# sourceMappingURL=api.js.map