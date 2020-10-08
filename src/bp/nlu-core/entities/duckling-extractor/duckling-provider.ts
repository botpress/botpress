import Axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import { NLU } from 'botpress/sdk'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import { Duckling, DucklingDimension } from './typings'

export interface DucklingParams {
  tz: string
  refTime: number
  lang: string
}

const DISABLED_MSG = `, so it will be disabled.
For more information (or if you want to self-host it), please check the docs at
https://botpress.com/docs/build/nlu/#system-entities
`

const RETRY_POLICY = { backoff: 2, max_tries: 3, timeout: 500 }

export const DUCKLING_ENTITIES: DucklingDimension[] = [
  'amountOfMoney',
  'distance',
  'duration',
  'email',
  'number',
  'ordinal',
  'phoneNumber',
  'quantity',
  'temperature',
  'time',
  'url',
  'volume'
]

export class DucklingProvider {
  public static client: AxiosInstance

  constructor(private logger?: NLU.Logger) {}

  public static async configure(url: string, logger?: NLU.Logger): Promise<boolean> {
    const proxyConfig = process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}
    this.client = Axios.create({
      baseURL: url,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      ...proxyConfig
    })

    let success = false
    try {
      await retry(async () => {
        const { data } = await this.client.get('/')
        if (data !== 'quack!') {
          return logger && logger.warning(`Bad response from Duckling server ${DISABLED_MSG}`)
        }
        success = true
      }, RETRY_POLICY)
    } catch (err) {
      logger && logger.warning(`Couldn't reach the Duckling server ${DISABLED_MSG}`, err)
    }

    return success
  }

  public async fetchDuckling(text: string, { lang, tz, refTime }: DucklingParams): Promise<Duckling[]> {
    try {
      return await retry(async () => {
        const { data } = await DucklingProvider.client.post(
          '/parse',
          `lang=${lang}&text=${encodeURI(text)}&reftime=${refTime}&tz=${tz}`
        )

        if (!_.isArray(data)) {
          throw new Error('Unexpected response from Duckling. Expected an array.')
        }

        return data
      }, RETRY_POLICY)
    } catch (err) {
      const error = err.response ? err.response.data : err
      this.logger && this.logger.warning('Error extracting duckling entities', error)
      return []
    }
  }
}
