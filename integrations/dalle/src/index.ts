import axios from 'axios'
import { buildApiData, validateResponse, getApiConfig } from './client'
import { GenerateImageOutput } from './types'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateImage: async ({ ctx, input, logger }): Promise<GenerateImageOutput> => {
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
        return { url: '', createdDate: Date.now().toString() }
      }
    },
  },
  channels: {},
  handler: async () => {},
})
