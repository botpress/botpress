/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'pipedrive',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Pipedrive',
  description: 'Pipedrive integration for Botpress',
  configuration: {
    schema: z.object({
      secret: z
        .string()
        .optional()
        .title('Secret')
        .describe(
          'Secret that must be sent with the request as a header called "x-bp-secret." Leave empty to allow all requests without a secret.'
        ),
      allowedOrigins: z
        .array(z.string())
        .optional()
        .title('Allowed Origins')
        .describe(
          'List of allowed origins for CORS. Leaving this field empty will block all requests originating from a browser and only allow requests from a server.'
        ),
    }),
  },
  actions: {
    createDeal: {
      title: 'createDeal',
      description: 'Create a new deal in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Deal Title').describe('The title of the deal.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
    createLead: {
      title: 'createLead',
      description: 'Create a new lead in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Lead Title').describe('The title of the lead.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
    deleteLead: {
      title: 'deleteLead.',
      description: 'Delete a lead in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Lead Title').describe('The title of the lead to delete.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
    deleteDeal: {
      title: 'deleteDeal',
      description: 'Delete a deal in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Deal Title').describe('The title of the deal to delete.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
    changeDeal: {
      title: 'changeDeal',
      description: 'Change a deal in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Deal Title').describe('The title of the deal to change.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
    changeLead: {
      title: 'changeLead',
      description: 'Change a lead in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Lead Title').describe('The title of the lead to change.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
  },
  events: {
    // TODO We should use the same schema for all events ...
    createLead: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },

    createDeal: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
    changeLead: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
    changeDeal: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
    deleteDeal: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
    deleteLead: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(z.union([z.string(), z.string().array()])),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
  },
})
