import * as botpress from '.botpress'
import axios from 'axios'
import { buildApiData, validateResponse, getApiConfig } from './client'
import { TGenerateImageOutput, TContext } from 'types'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async () => { },
  unregister: async () => { },
  actions: {
    generateImage: async ({ ctx, input, logger }): Promise<TGenerateImageOutput> => {

      logger.forBot().info('Generating Image')

      const { apiUrl, headers } = getApiConfig(ctx)
      const data = buildApiData(input)

      try {

        const response = await axios.post(apiUrl, data, { headers })
        validateResponse(response)

        const image = response.data.data[0].url
        const createdDate = response.data.created.toString()

        return { url: image, createdDate }
      } catch (error) {
        logger.forBot().error('Error creating image:', error)
        return { url: '', createdDate: Date.now().toString()}
      }
    }
  },
  channels: {
    channel: {
      messages: {
        text: async () => {
          throw new NotImplementedError()
        },
        image: async () => {
          throw new NotImplementedError()
        },
        markdown: async () => {
          throw new NotImplementedError()
        },
        audio: async () => {
          throw new NotImplementedError()
        },
        video: async () => {
          throw new NotImplementedError()
        },
        file: async () => {
          throw new NotImplementedError()
        },
        location: async () => {
          throw new NotImplementedError()
        },
        carousel: async () => {
          throw new NotImplementedError()
        },
        card: async () => {
          throw new NotImplementedError()
        },
        choice: async () => {
          throw new NotImplementedError()
        },
        dropdown: async () => {
          throw new NotImplementedError()
        },
      },
    },
  },
  handler: async () => { },
})
