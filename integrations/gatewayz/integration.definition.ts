import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import {
  chatCompletionsInputSchema,
  chatCompletionsOutputSchema,
  getModelsOutputSchema,
  getProvidersOutputSchema,
  getUserBalanceOutputSchema,
  getUserProfileOutputSchema,
  updateUserProfileInputSchema,
  createApiKeyInputSchema,
  apiKeyOutputSchema,
  userRegistrationInputSchema,
  userRegistrationOutputSchema,
  healthCheckOutputSchema,
  apiKeyUsageOutputSchema
} from './src/schemas'

export default new sdk.IntegrationDefinition({
  name: 'gatewayz',
  title: 'Gatewayz',
  description: 'AI Gateway API integration for accessing AI models with credit management. Connect to OpenRouter models through Gatewayz.',
  version: '0.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
<<<<<<< Current (Your changes)
=======
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).describe('Gatewayz API Key for authentication'),
      baseUrl: z.string().optional().default('https://gatewayz-app.vercel.app').describe('Base URL for Gatewayz API (default: https://gatewayz-app.vercel.app)')
    })
  },
  actions: {
    chatCompletions: {
      title: 'Chat Completions',
      description: 'Generate AI chat completions using available models',
      input: {
        schema: chatCompletionsInputSchema
      },
      output: {
        schema: chatCompletionsOutputSchema
      }
    },
    getModels: {
      title: 'Get Available Models',
      description: 'Get list of available AI models from OpenRouter',
      input: {
        schema: z.object({})
      },
      output: {
        schema: getModelsOutputSchema
      }
    },
    getProviders: {
      title: 'Get Model Providers',
      description: 'Get provider statistics for available models',
      input: {
        schema: z.object({})
      },
      output: {
        schema: getProvidersOutputSchema
      }
    },
    getUserBalance: {
      title: 'Get User Balance',
      description: 'Get current user credit balance',
      input: {
        schema: z.object({})
      },
      output: {
        schema: getUserBalanceOutputSchema
      }
    },
    getUserProfile: {
      title: 'Get User Profile',
      description: 'Get user profile information',
      input: {
        schema: z.object({})
      },
      output: {
        schema: getUserProfileOutputSchema
      }
    },
    updateUserProfile: {
      title: 'Update User Profile',
      description: 'Update user profile information',
      input: {
        schema: updateUserProfileInputSchema
      },
      output: {
        schema: getUserProfileOutputSchema
      }
    },
    createApiKey: {
      title: 'Create API Key',
      description: 'Create a new API key for the user',
      input: {
        schema: createApiKeyInputSchema
      },
      output: {
        schema: apiKeyOutputSchema
      }
    },
    getApiKeyUsage: {
      title: 'Get API Key Usage',
      description: 'Get usage statistics for all API keys',
      input: {
        schema: z.object({})
      },
      output: {
        schema: apiKeyUsageOutputSchema
      }
    },
    registerUser: {
      title: 'Register User',
      description: 'Register a new user with unified API key system',
      input: {
        schema: userRegistrationInputSchema
      },
      output: {
        schema: userRegistrationOutputSchema
      }
    },
    healthCheck: {
      title: 'Health Check',
      description: 'Check the health status of the Gatewayz API',
      input: {
        schema: z.object({})
      },
      output: {
        schema: healthCheckOutputSchema
      }
    }
  }
>>>>>>> Incoming (Background Agent changes)
})

