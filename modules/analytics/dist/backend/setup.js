"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _db = _interopRequireDefault(require("./db"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = async (bp, interactionsToTrack) => {
  const db = new _db.default(bp);
  await db.initializeDb(); // Dev: uncomment to generate users/interactions
  // seed.run(bp.database)

  bp.events.registerMiddleware({
    name: 'analytics.incoming',
    direction: 'incoming',
    handler: incomingMiddleware,
    order: 5,
    description: 'Tracks incoming messages for Analytics purposes'
  });
  bp.events.registerMiddleware({
    name: 'analytics.outgoing',
    direction: 'outgoing',
    handler: outgoingMiddleware,
    order: 5,
    description: 'Tracks outgoing messages for Analytics purposes'
  });

  function incomingMiddleware(event, next) {
    if (!_lodash.default.includes(interactionsToTrack, event.type)) {
      return next();
    } // Asynchronously save the interaction (non-blocking)


    db.saveIncoming(event).then().catch(() => {
      bp.logger.debug('Could not save incoming interaction for ' + event.channel);
    });
    next();
  }

  function outgoingMiddleware(event, next) {
    if (!_lodash.default.includes(interactionsToTrack, event.type)) {
      return next();
    } // Asynchronously save the interaction (non-blocking)


    db.saveOutgoing(event).then().catch(() => {
      bp.logger.debug('Could not save outgoing interaction for ' + event.channel);
    });
    next();
  }
};

exports.default = _default;
//# sourceMappingURL=setup.js.map