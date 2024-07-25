import axios, { AxiosRequestConfig } from 'axios'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const makeApiRequest: bp.IntegrationProps['actions']['makeApiRequest'] = async ({
  ctx,
  input,
}): Promise<bp.actions.makeApiRequest.output.Output> => {
  const { method, path, headers, params, requestBody } = input
  const client = getZendeskClient(ctx.configuration)

  try {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: `/api/v2/${path}`,
      headers: headers ? JSON.parse(headers) : {},
      params: params ? JSON.parse(params) : {},
    }

    if (method.toLowerCase() !== 'get') {
      requestConfig.data = requestBody ? JSON.parse(requestBody) : {}
    }

    const responseData = await client.makeRequest(requestConfig)

    return {
      success: true,
      data: responseData,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: `JSON Parsing error: ${error.message}` }
    } else if (axios.isAxiosError(error)) {
      return { success: false, error: `API error: ${error.message}` }
    } else {
      return {
        success: false,
        error: `Unknown error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
      }
    }
  }
}
