import * as sdk from '@botpress/sdk'
import { AxiosRequestConfig } from 'axios'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const callApi: bp.IntegrationProps['actions']['callApi'] = async ({
  ctx,
  input,
}): Promise<bp.actions.callApi.output.Output> => {
  const { method, path, headers, params, requestBody } = input
  const client = getZendeskClient(ctx.configuration)

  try {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: `/api/v2/${path}`,
      headers: headers ? JSON.parse(headers) : {},
      params: params ? JSON.parse(params) : {},
      validateStatus: () => true,
    }

    if (method !== 'GET') {
      requestConfig.data = requestBody ? JSON.parse(requestBody) : {}
    }

    return await client.makeRequest(requestConfig)
  } catch (error) {
    throw new sdk.RuntimeError(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
  }
}
