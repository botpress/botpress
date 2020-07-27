import axios, { AxiosResponse } from 'axios'
import _ from 'lodash'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class BotpressPredictor {
  userId
  constructor(public axiosConfig, public botName) {
    this.axiosConfig.baseUrl = `http://localhost:3000/api/v1/bots/${this.botName}`
    this.userId = _.uniqueId('user_')
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

    let tries = 1
    const maxTries = 5
    let success = false
    let response
    while (!success && tries <= maxTries) {
      try {
        response = await axios.post(
          `/converse/${this.userId}/secured?include=decision,nlu`,
          {
            type: 'text',
            text: question
          },
          this.axiosConfig
        )
        success = true
      } catch (err) {
        tries++
        await sleep(2000)
        if (tries > maxTries) {
          throw err
        }
      }
    }

    const {
      data: {
        nlu: {
          intent: { confidence, context, name },
          slots,
          intents
        }
      }
    } = response as AxiosResponse

    // const pred = _.chain(nlu.predictions)
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
    return { label: name.replace('__qna__', '').replace('",', ''), confidence }
  }
}
