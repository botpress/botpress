import * as botpress from '.botpress'
import axios from 'axios'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async () => {}, 
  unregister: async () => {},
  actions: {
    sendData: async function ({ ctx, input, logger }): Promise<botpress.actions.sendData.output.Output> {
      logger.forBot().info('Sending data to Make.com');
  
      const webhookURL = ctx.configuration.webhookUrl;
      let dataToSend;
      try {
        dataToSend = JSON.parse(input.data);
      } catch (error) {
        if (error instanceof Error) {
          logger.forBot().error(`Invalid JSON format: ${error.message}`);
        } else {
          logger.forBot().error(`Invalid JSON format and the error could not be identified`);
        }
        return { response: [{ response: 'Invalid data format' }] };
      }
  
      const nestedData = { data: dataToSend };
      const start = Date.now();

      try {
        const response = await axios.post(webhookURL, nestedData);
        const duration = Date.now() - start;
        logger.forBot().info(`Successfully sent data to Make.com, duration: ${duration}ms, status code: ${response.status}`);
        return { response: [{ response: response.data }] };
      } catch (error) {
        const duration = Date.now() - start;
        if (axios.isAxiosError(error)) {
          const status = error.response ? error.response.status : 'Network Error';
          logger.forBot().error({
            message: `Error sending data to Make.com. Status: ${status}, duration: ${duration}ms`,
            error: error.message,
            status: error.response ? error.response.status : 'Network Error',
            duration: Date.now() - start,
            requestData: nestedData,
            response: error.response?.data,
          });
          return { response: [{ response: `Error sending data to Make.com, Status: ${status}, Error: ${error.message}, Duration: ${Date.now() - start}ms. Check you webhook url` }] };
        } else {
          logger.forBot().error(`An unknown error occurred while sending data to Make.com`);
          return { response: [{ response: `An unknown error occurred while sending data to Make.com, Duration: ${Date.now() - start}ms` }] };
        }
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
  handler: async () => {},
})