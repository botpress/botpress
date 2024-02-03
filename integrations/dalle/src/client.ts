import { AxiosResponse } from 'axios';
import { defaultSize, defaultModel, defaultQuality, TDalleData, TContext } from 'types'

export function buildApiData(input: TDalleData) {
  return {
    prompt: input.prompt,
    n: 1,
    size: defaultSize, // Replace with enum input.size,
    model: defaultModel, // Replace with enum input.model,
    quality: defaultQuality // Replace with enum input.quality
  }
}

export function getApiConfig(ctx: any) {
  const apiKey = ctx.configuration.apiKey
  const apiUrl = 'https://api.openai.com/v1/images/generations'
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }
  return { apiUrl, headers }
}

export function validateResponse(response: AxiosResponse<any, any>) {

  if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].url) {
    throw new Error('Invalid response format from API')
  }
}
