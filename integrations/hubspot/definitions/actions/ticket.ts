import { ActionDefinition, z } from '@botpress/sdk'

const createTicket: ActionDefinition = {
  title: 'Create Ticket',
  description: 'Create a ticket in Hubspot',
  input: {
    schema: z.object({
      subject: z.string().title('Ticket name').describe('Short summary of ticket'),
      category: z
        .enum(['Product Issue', 'Billing Issue', 'Feature Request', 'General Inquiry'])
        .optional()
        .title('Category')
        .describe('Main reason customer reached out for help'),
      description: z.string().optional().title('Ticket description').describe('Description of the ticket'),
      pipeline: z
        .string()
        .title('Pipeline')
        .describe('The pipeline that contains this ticket. Can be a name or internal ID'),
      pipelineStage: z
        .string()
        .title('Ticket status')
        .describe('The pipeline stage that contains this ticket. Can be a name or internal ID'),
      priority: z
        .enum(['Low', 'Medium', 'High', 'Urgent'])
        .optional()
        .title('Priority')
        .describe('The level of attention needed on the ticket'),
      ticketOwner: z
        .string()
        .optional()
        .title('Ticket owner')
        .describe('User the ticket is assigned to. Can be an email address or user ID'),
      linearTicketUrl: z.string().optional().title('Linear Ticket URL').describe('Link to the linear ticket'),
      source: z
        .enum(['Zoom', 'Email', 'Phone', 'Chat', 'Form'])
        .optional()
        .title('Source')
        .describe('The original source of the ticket'),
      additionalProperties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .title('Additional Properties')
        .describe('Additional ticket properties'),
    }),
  },
  output: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('The ID of the created ticket'),
    }),
  },
}

export const actions = {
  createTicket,
} as const
