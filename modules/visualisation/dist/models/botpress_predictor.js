"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BotpressPredictor = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class BotpressPredictor {
  constructor(axiosConfig, botName) {
    this.axiosConfig = axiosConfig;
    this.botName = botName;

    _defineProperty(this, "userId", void 0);

    this.axiosConfig.baseUrl = `http://localhost:3000/api/v1/bots/${this.botName}`;
    this.userId = _lodash.default.uniqueId('user_');
  }

  async predict(question) {
    // const {
    //   data: { nlu }
    // } = await axios.post(
    //   // 'mod/nlu/predict',
    //   `/converse/${this.userId}/secured?include=decision,nlu`,
    //   {
    //     type: 'text',
    //     text: question
    //   },
    //   this.axiosConfig
    // )
    let tries = 1;
    const maxTries = 5;
    let success = false;
    let response;

    while (!success && tries <= maxTries) {
      try {
        response = await _axios.default.post(`/converse/${this.userId}/secured?include=decision,nlu`, {
          type: 'text',
          text: question
        }, this.axiosConfig);
        success = true;
      } catch (err) {
        tries++;
        await sleep(2000);

        if (tries > maxTries) {
          throw err;
        }
      }
    }

    const {
      data: {
        nlu: {
          intent: {
            confidence,
            context,
            name
          },
          slots,
          intents
        }
      }
    } = response; // const pred = _.chain(nlu.predictions)
    //   .toPairs()
    //   .flatMap(([ctx, ctxPredObj]) => {
    //     return ctxPredObj.intents.map(intentPred => {
    //       const oosFactor = 1 - ctxPredObj.oos
    //       return {
    //         contexts: [ctx],
    //         feedbacks: [],
    //         label: intentPred.label,
    //         confidence: intentPred.confidence * oosFactor * ctxPredObj.confidence
    //       }
    //     })
    //   })
    //   .maxBy('confidence')
    //   .value()
    // return { label: pred.label, confidence: pred.confidence }

    return {
      label: name.replace('__qna__', '').replace('",', ''),
      confidence
    };
  }

}

exports.BotpressPredictor = BotpressPredictor;
//# sourceMappingURL=botpress_predictor.js.map