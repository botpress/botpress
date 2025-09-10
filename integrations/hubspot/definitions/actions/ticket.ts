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

const createTicket: ActionDefinition = {
  title: 'Create Ticket',
  description: 'Create a ticket in Hubspot',
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

export const actions = {
  createTicket,
} as const
