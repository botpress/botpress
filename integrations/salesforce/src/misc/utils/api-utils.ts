import axios, { AxiosResponse } from 'axios'
import { Input } from '.botpress/implementation/actions/makeApiRequest/input'

export const makeRequest = async (url: string, input: Input, accessToken: string): Promise<AxiosResponse> => {
  return axios({
    method: input.method,
    url,
    data: input.requestBody ? JSON.parse(input.requestBody) : {},
    params: input.params ? JSON.parse(input.params) : {},
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(input.headers ? JSON.parse(input.headers) : {}),
    },
  })
}
