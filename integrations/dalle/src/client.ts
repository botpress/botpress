import { AxiosResponse } from 'axios'
import * as bp from '.botpress'

type DalleData = bp.actions.generateImage.input.Input

const defaultSize: NonNullable<DalleData['size']> = '1024x1024'
const defaultModel: NonNullable<DalleData['model']> = 'dall-e-3'
const defaultQuality: NonNullable<DalleData['quality']> = 'standard'

export function buildApiData(input: DalleData) {
  return {
    prompt: input.prompt,
    n: 1,
    size: input.size ?? defaultSize,
    model: input.model ?? defaultModel,
    quality: input.quality ?? defaultQuality,
  }
}

export function getApiConfig(ctx: any) {
  const apiKey = ctx.configuration.apiKey
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
