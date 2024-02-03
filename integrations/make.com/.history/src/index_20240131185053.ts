import * as botpress from '.botpress'
import axios, { AxiosInstance } from 'axios'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async () => {}, // Add some logger here
  unregister: async () => {}, // Add logger here
  actions: {
    sendData: async function ({ ctx, input, logger }): Promise<botpress.actions.sendData.output.Output> {
      
      logger.forBot().info('Sending data to Make.com');
    
      const webhookURL = ctx.configuration.webhookURL;
      const dataToSend = input.data;
    
      const data = JSON.stringify({ data: dataToSend });
    
      try {
        const response = await axios.post(webhookURL, data);
    
        if (response.status === 200) {
          logger.forBot().error('Very nice');
          console.log('Log: Very nice');
          return { response: response.data };
        } else if (response.status === 400) {
          logger.forBot().error('Make.com queue is full');
          console.log('Log: Make.com queue is full');
          return { response: 'Queue is full' };
        } else if (response.status === 500) {
          logger.forBot().error('Make.com scenario failed');
          console.log('Log: Make.com scenario failed');
          return { response: 'Scenario failed' };
        } else {
          logger.forBot().error(`Unexpected response status: ${response.status}`);
          console.log('Log: Unexpected response status');
          return { response: `Unexpected status code: ${response.status}` };
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.forBot().error(`Error sending data to Make.com: ${error.message}`);
          console.log(`Log: Error sending data to Make.com: ${error.message}`);
          return { response: `Error: ${error.message}` };
        } else {
          logger.forBot().error(`An unknown error occurred while sending data to Make.com`);
          console.log(An unknown error occurred while sending data to Make.com`);
          return { response: 'An unknown error occurred' };
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