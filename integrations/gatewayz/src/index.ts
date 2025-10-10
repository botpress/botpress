import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as bp from '.botpress'
import { GatewayzClient } from './client'

const integration = new bp.Integration({
  register: async () => {
    // Integration registration logic if needed
  },
  unregister: async () => {
    // Integration cleanup logic if needed
  },
  actions: {
    chatCompletions: async ({ ctx, input }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.chatCompletions(input)
    },

    getModels: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.getModels()
    },

    getProviders: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.getProviders()
    },

    getUserBalance: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.getUserBalance()
    },

    getUserProfile: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.getUserProfile()
    },

    updateUserProfile: async ({ ctx, input }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.updateUserProfile(input)
    },

    createApiKey: async ({ ctx, input }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.createApiKey(input)
    },

    getApiKeyUsage: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.getApiKeyUsage()
    },

    registerUser: async ({ ctx, input }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.registerUser(input)
    },

    healthCheck: async ({ ctx }) => {
      const client = new GatewayzClient(ctx.configuration)
      return await client.healthCheck()
    }
  },
  channels: {},
  handler: async () => {
    // Webhook handler logic if needed
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

