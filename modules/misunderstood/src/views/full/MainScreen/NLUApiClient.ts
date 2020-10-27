import { AxiosRequestConfig, AxiosStatic } from 'axios'

const NLU_URL_PREFIX = '/nlu'

class NLUApiClient {
  constructor(private axios: AxiosStatic) {}

  async get(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.get(NLU_URL_PREFIX + url, config)
    return res.data
  }

  async getIntents() {
    const data = await this.get('/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  }
}

export default NLUApiClient
