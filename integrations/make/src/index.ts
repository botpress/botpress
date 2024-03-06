import axios from 'axios'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    async sendData({ ctx, input, logger }) {
      logger.forBot().info('Sending data to Make.com')

      const webhookURL = ctx.configuration.webhookUrl
      const start = Date.now()

      try {
        const requestData = JSON.parse(input.data)

        const { data: response, status } = await axios.post(webhookURL, { data: requestData })

        const duration = Date.now() - start
        logger.forBot().info(`Successfully sent data to Make.com, duration: ${duration}ms, status code: ${status}`)

        return { success: true, response }
      } catch (error) {
        const duration = Date.now() - start
        if (axios.isAxiosError(error)) {
          const status = error.response ? error.response.status : 'Network Error'
          logger
            .forBot()
            .error(`Error sending data to Make.com. Status: ${status}, duration: ${duration}ms: ${error.message}`, {
              response: error.response?.data,
            })
        } else if (error instanceof SyntaxError) {
          logger.forBot().error(`Error parsing input JSON data: ${error.message}`)
        } else {
          logger.forBot().error(`Error sending data to Make.com. Duration: ${duration}ms`, {
            error,
          })
        }
      }
      return { success: false, response: null }
    },
  },
  channels: {},
  handler: async () => {},
})
