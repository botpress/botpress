import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getCredentials } from './auth'
import * as bp from '.botpress'

export const getAxiosClient = async ({
  ctx,
  client,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<AxiosInstance> => {
  const { APIKey, projectId } = await getCredentials({ ctx, client })
  const baseURL = `https://api.mintlify.com/v1/agent/${projectId}`

  const instance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${APIKey}`,
    },
  })

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {}
    return config
  })

  return instance
}
