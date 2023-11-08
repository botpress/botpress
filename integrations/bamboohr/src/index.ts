import * as botpress from '.botpress'
import { BambooHRClient } from './client'

console.info('starting integration')

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async () => {
    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    getEmployee: async ({ input, ctx }) => {
      const client = new BambooHRClient(ctx.configuration)
      return client.getEmployee(input.id)
    },
    getEmployees: async ({ ctx }) => {
      const client = new BambooHRClient(ctx.configuration)
      return client.getEmployees()
    },
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
  handler: async () => {
    throw new NotImplementedError()
  },
})
