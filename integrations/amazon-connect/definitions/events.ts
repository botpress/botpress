import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const events = {
  contactStarted: {
    title: 'Contact Started',
    description: 'Triggered when a new contact is initiated in Amazon Connect',
    schema: z.object({
      contactId: z.string(),
      initiationMethod: z.string(),
      channel: z.string(),
    }),
  },
  contactEnded: {
    title: 'Contact Ended',
    description: 'Triggered when a contact ends in Amazon Connect',
    schema: z.object({
      contactId: z.string(),
      disconnectReason: z.string().optional(),
    }),
  },
  agentConnected: {
    title: 'Agent Connected',
    description: 'Triggered when an agent joins the conversation',
    schema: z.object({
      contactId: z.string(),
      agentId: z.string(),
      agentName: z.string().optional(),
    }),
  },
  agentDisconnected: {
    title: 'Agent Disconnected',
    description: 'Triggered when an agent leaves the conversation',
    schema: z.object({
      contactId: z.string(),
      agentId: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['events']
