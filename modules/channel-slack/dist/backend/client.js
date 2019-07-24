"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupMiddleware = setupMiddleware;
exports.SlackClient = void 0;

var _interactiveMessages = require("@slack/interactive-messages");

var _rtmApi = require("@slack/rtm-api");

var _webApi = require("@slack/web-api");

var _axios = _interopRequireDefault(require("axios"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const debug = DEBUG('channel-slack');
const debugIncoming = debug.sub('incoming');
const debugOutgoing = debug.sub('outgoing');
const outgoingTypes = ['text', 'image', 'actions', 'typing', 'carousel'];

class SlackClient {
  constructor(bp, botId, config, router) {
    this.bp = bp;

    _defineProperty(this, "router", void 0);

    _defineProperty(this, "client", void 0);

    _defineProperty(this, "rtm", void 0);

    _defineProperty(this, "interactive", void 0);

    _defineProperty(this, "botId", void 0);

    this.botId = botId;
    this.router = router;
    this.client = new _webApi.WebClient(config.botToken);
    this.rtm = new _rtmApi.RTMClient(config.botToken);
    this.interactive = (0, _interactiveMessages.createMessageAdapter)(config.signingSecret, {});
  }

  async initialize() {
    await this._setupInteractiveListener();
    await this._setupRealtime();
  }

  _setupInteractiveListener() {
    this.interactive.action({
      type: 'button'
    }, async payload => {
      debugIncoming(`Received interactive message %o`, payload);

      const actionId = _lodash.default.get(payload, 'actions[0].action_id', '');

      const label = _lodash.default.get(payload, 'actions[0].text.text', '');

      const value = _lodash.default.get(payload, 'actions[0].value', ''); // Some actions (ex: open url) should be discarded


      if (!actionId.startsWith('discard_action')) {
        // Either we leave buttons displayed, we replace with the selection, or we remove it
        if (actionId.startsWith('replace_buttons')) {
          await _axios.default.post(payload.response_url, {
            text: `*${label}*`
          });
        } else if (actionId.startsWith('remove_buttons')) {
          await _axios.default.post(payload.response_url, {
            delete_original: true
          });
        }

        await this.sendEvent(payload, {
          type: 'quick_reply',
          text: label,
          payload: value
        });
      }
    });
    this.interactive.action({
      actionId: 'option_selected'
    }, async payload => {
      const label = _lodash.default.get(payload, 'actions[0].selected_option.text.text', '');

      const value = _lodash.default.get(payload, 'actions[0].selected_option.value', ''); //  await axios.post(payload.response_url, { text: `*${label}*` })


      await this.sendEvent(payload, {
        type: 'quick_reply',
        text: label,
        payload: value
      });
    });
    this.router.use(`/bots/${this.botId}/callback`, this.interactive.requestListener());
  }

  async _setupRealtime() {
    const discardedSubtypes = ['bot_message', 'message_deleted', 'message_changed'];
    this.rtm.on('message', async payload => {
      debugIncoming(`Received real time payload %o`, payload);

      if (!discardedSubtypes.includes(payload.subtype)) {
        await this.sendEvent(payload, {
          type: 'text',
          text: payload.text
        });
      }
    });
    await this.rtm.start();
  }

  async handleOutgoingEvent(event, next) {
    if (event.type === 'typing') {
      await this.rtm.sendTyping(event.threadId || event.target);
      await new Promise(resolve => setTimeout(() => resolve(), 1000));
      return next(undefined, false);
    }

    const messageType = event.type === 'default' ? 'text' : event.type;

    if (!_lodash.default.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type));
    }

    const blocks = [];

    if (messageType === 'image' || messageType === 'actions') {
      blocks.push(event.payload);
    } else if (messageType === 'carousel') {
      event.payload.cards.forEach(card => blocks.push(...card));
    }

    if (event.payload.quick_replies) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: event.payload.text
        }
      });
      blocks.push(event.payload.quick_replies);
    }

    const message = {
      text: event.payload.text,
      channel: event.threadId || event.target,
      blocks
    };
    debugOutgoing(`Sending message %o`, message);
    await this.client.chat.postMessage(message);
    next(undefined, false);
  }

  async sendEvent(ctx, payload) {
    const threadId = _lodash.default.get(ctx, 'channel.id') || _lodash.default.get(ctx, 'channel');

    const target = _lodash.default.get(ctx, 'user.id') || _lodash.default.get(ctx, 'user');

    this.bp.events.sendEvent(this.bp.IO.Event({
      botId: this.botId,
      channel: 'slack',
      direction: 'incoming',
      payload,
      type: payload.type,
      preview: payload.text,
      threadId: threadId && threadId.toString(),
      target: target && target.toString()
    }));
  }

}

exports.SlackClient = SlackClient;

async function setupMiddleware(bp, clients) {
  bp.events.registerMiddleware({
    description: 'Sends out messages that targets platform = slack.' + ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'slack.sendMessages',
    order: 100
  });

  async function outgoingHandler(event, next) {
    if (event.channel !== 'slack') {
      return next();
    }

    const client = clients[event.botId];

    if (!client) {
      return next();
    }

    return client.handleOutgoingEvent(event, next);
  }
}
//# sourceMappingURL=client.js.map