import { ActionDefinition, z } from '@botpress/sdk'

export const ticketSchema = z.object({
  id: z.string().title('Ticket ID').describe('The ID of the ticket'),
  subject: z.string().title('Ticket name').describe('Short summary of ticket'),
  category: z.string().title('Category').describe('Main reason customer reached out for help'),
  description: z.string().title('Ticket description').describe('Description of the ticket'),
  priority: z.string().title('Priority').describe('The level of attention needed on the ticket'),
  source: z.string().title('Source').describe('The original source of the ticket'),
  properties: z.record(z.string().nullable()).title('Properties').describe('The properties of the ticket'),
})

const searchTicket: ActionDefinition = {
  title: 'Search Ticket',
  description: 'Search for a ticket in HubSpot',
  input: {
    schema: z.object({
      subject: z.string().optional().title('Ticket name').describe('The subject of the ticket to search for'),
      category: z.string().optional().title('Category').describe('Main reason customer reached out for help'),
      priority: z.string().optional().title('Priority').describe('The level of attention needed on the ticket'),
      properties: z
        .array(z.string())
        .optional()
        .title('Properties to Fetch')
        .describe('The list of property names to fetch on the matching ticket. Defaults to all properties.'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema.optional().title('Ticket').describe('The ticket found, or undefined if not found'),
    }),
  },
}

const createTicket: ActionDefinition = {
  title: 'Create Ticket',
  description: 'Create a ticket in HubSpot',
  input: {
    schema: z.object({
      subject: z.string().title('Ticket name').describe('Short summary of ticket'),
      category: z.string().optional().title('Category').describe('Main reason customer reached out for help'),
      description: z.string().optional().title('Ticket description').describe('Description of the ticket'),
      priority: z.string().optional().title('Priority').describe('The level of attention needed on the ticket'),
      source: z.string().optional().title('Source').describe('The original source of the ticket'),
      pipeline: z
        .string()
        .title('Pipeline')
        .describe('The pipeline that contains this ticket. Can be a name or internal ID'),
      pipelineStage: z
        .string()
        .title('Ticket status')
        .describe('The pipeline stage that contains this ticket. Can be a name or internal ID'),
      ticketOwner: z
        .string()
        .optional()
        .title('Ticket owner')
        .describe('User the ticket is assigned to. Can be an email address or user ID'),
      requester: z
        .string()
        .optional()
        .title('Customer')
        .describe('The ticket requester. Can be an email address or contact ID'),
      company: z
        .string()
        .optional()
        .title('Company')
        .describe('The company associated with the ticket. Can be a name, domain, or company ID'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .optional()
        .title('Additional Properties')
        .describe('Additional ticket properties'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema.title('Ticket').describe('The created ticket'),
    }),
  },
}

const getTicket: ActionDefinition = {
  title: 'Get Ticket',
  description: 'Get a ticket from HubSpot',
  input: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('The ID of the ticket to get'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema
        .extend({
          pipeline: z
            .object({
              id: z.string().title('Pipeline ID').describe('The internal ID of the pipeline'),
              label: z.string().title('Pipeline').describe('The name of the pipeline'),
            })
            .title('Pipeline')
            .describe('The pipeline that contains this ticket'),
          pipelineStage: z
            .object({
              id: z.string().title('Ticket status ID').describe('The internal ID of the pipeline stage'),
              label: z.string().title('Ticket status').describe('The name of the pipeline stage'),
            })
            .title('Ticket status')
            .describe('The pipeline stage that contains this ticket'),
        })
        .title('Ticket')
        .describe('The fetched ticket'),
    }),
  },
}

const updateTicket: ActionDefinition = {
  title: 'Update Ticket',
  description: 'Update a ticket in HubSpot',
  input: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('The ID of the ticket to update'),
      subject: z.string().optional().title('Ticket name').describe('Short summary of ticket'),
      category: z.string().optional().title('Category').describe('Main reason customer reached out for help'),
      description: z.string().optional().title('Ticket description').describe('Description of the ticket'),
      priority: z.string().optional().title('Priority').describe('The level of attention needed on the ticket'),
      source: z.string().optional().title('Source').describe('The original source of the ticket'),
      pipeline: z
        .string()
        .optional()
        .title('Pipeline')
        .describe('The pipeline that contains this ticket. Can be a name or internal ID'),
      pipelineStage: z
        .string()
        .optional()
        .title('Ticket status')
        .describe(
          "The pipeline stage that contains this ticket. Can be a name or internal ID. Resolved against the ticket's current pipeline unless a pipeline is also provided"
        ),
      ticketOwner: z
        .string()
        .optional()
        .title('Ticket owner')
        .describe('User the ticket is assigned to. Can be an email address or user ID'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The new value of the property'),
          })
        )
        .optional()
        .title('Additional Properties')
        .describe('Additional ticket properties'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema
        .extend({
          // May not be returned by API
          subject: ticketSchema.shape.subject.optional(),
          category: ticketSchema.shape.category.optional(),
          description: ticketSchema.shape.description.optional(),
          priority: ticketSchema.shape.priority.optional(),
          source: ticketSchema.shape.source.optional(),
        })
        .title('Ticket')
        .describe('The updated ticket'),
    }),
  },
}

const deleteTicket: ActionDefinition = {
  title: 'Delete Ticket',
  description: 'Delete a ticket in HubSpot',
  input: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('The ID of the ticket to delete'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
}

export const actions = {
  searchTicket,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
} as const
