import axios from 'axios'
import { buildApiData, validateResponse, getApiConfig } from './client'
import * as bp from '.botpress'

type GenerateImageOutput = bp.actions.generateImage.output.Output

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateImage: async (args): Promise<GenerateImageOutput> => {
      args.logger.forBot().info('Generating Image')

      const { apiUrl, headers } = getApiConfig(args)
      const data = buildApiData(args)

      try {
        const response = await axios.post(apiUrl, data, { headers })
        validateResponse(response)

        const image = response.data.data[0].url
        const createdDate = response.data.created.toString()

        return { url: image, createdDate }
      } catch (error) {
        args.logger.forBot().error('Error creating image:', error)
        return { url: '', createdDate: Date.now().toString() }
      }
    },
  },
  channels: {},
  handler: async () => {},
})
