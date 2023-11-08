import { IntegrationDefinition, messages } from '@botpress/sdk'
import { name } from './package.json'
import { z } from 'zod'

export default new IntegrationDefinition({
  name,
  version: '0.2.0',
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
  configuration: {
    schema: z.object({
      subdomain: z.string().min(1),
      apiKey: z.string().min(1),
    }),
  },
  actions: {
    getEmployee: {
      input: {
        schema: z.object({
          id: z.string(),
        }),
      },
      output: {
        schema: z.object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
        }),
      },
    },
    getEmployees: {
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({
          employees: z
            .object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              displayName: z.string(),
              gender: z.string(),
              jobTitle: z.string(),
              workPhone: z.string(),
              workPhoneExtension: z.string(),
              skypeUsername: z.string(),
              facebook: z.string(),
            })
            .array(),
        }),
      },
    },
  },
})
