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

    return { label: name.replace('__qna__', '').replace('",', ''), confidence }
  }
}
