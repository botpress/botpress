import Axios, { AxiosInstance } from 'axios'

import { LanguageSource } from './typings'

export const getLanguageSourceClient = (source: LanguageSource): AxiosInstance => {
  const headers: any = {}

  if (source.authToken) {
    headers['authorization'] = 'bearer ' + source.authToken
  }

  return Axios.create({ baseURL: source.endpoint, headers })
}
