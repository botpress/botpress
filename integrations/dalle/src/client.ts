import { AxiosResponse } from 'axios'
import * as schemas from './schemas'
import { ActionArgs } from './types'

export function buildApiData(args: ActionArgs) {
  const size = schemas.sizeConfig.safeParse(args, args.input.size)
  const quality = schemas.qualityConfig.safeParse(args, args.input.quality)
  const model = schemas.modelConfig.safeParse(args, args.input.model)
  return {
    prompt: args.input.prompt,
    n: 1,
    model,
    size,
    quality,
    user: args.input.user,
  }
}

export function getApiConfig(args: ActionArgs) {
  const apiKey = args.ctx.configuration.apiKey
  const apiUrl = 'https://api.openai.com/v1/images/generations'
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  return { apiUrl, headers }
}

export function validateResponse(response: AxiosResponse<any, any>) {
  if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].url) {
    throw new Error('Invalid response format from API')
  }
}
