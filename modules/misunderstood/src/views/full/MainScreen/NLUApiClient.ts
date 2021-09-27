import axios, { AxiosInstance, AxiosRequestConfig, AxiosStatic } from 'axios'

class NLUApiClient {
  private axios: AxiosInstance

  constructor(_static: AxiosStatic) {
    const { headers } = _static.defaults
    const baseURL = `${window.STUDIO_API_PATH}/nlu`
    this.axios = axios.create({ baseURL, headers })
  }

  async getIntents() {
    const { data } = await this.axios.get('intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  }
}

export default NLUApiClient
