import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, states } from './definitions'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'Hubspot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      accessToken: z.string().min(1).secret().title('Access Token').describe('Your Hubspot Access Token'),
      clientSecret: z
        .string()
        .secret()
        .optional()
        .title('Client Secret')
        .describe('Hubspot Client Secret (used for webhook signature check)'),
    }),
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  actions,
  events: {
    contactCreated: {
      title: 'Contact Created',
      description: 'A new contact has been created in Hubspot.',
      schema: z.object({
        contactId: z.string().title('Contact ID').describe('The ID of the created contact'),
        name: z.string().optional().title('Name').describe('The name of the created contact'),
        email: z.string().optional().title('Email').describe('The email of the created contact'),
        phoneNumber: z.string().optional().title('Phone Number').describe('The phone number of the created contact'),
      }),
    },
    contactDeleted: {
      title: 'Contact Deleted',
      description: 'A contact has been deleted in Hubspot.',
      schema: z.object({
        contactId: z.string().title('Contact ID').describe('The ID of the deleted contact'),
      }),
    },
    companyCreated: {
      title: 'Company Created',
      description: 'A new company has been created in Hubspot.',
      schema: z.object({
        companyId: z.string().title('Company ID').describe('The ID of the created company'),
        name: z.string().optional().title('Name').describe('The name of the created company'),
        domain: z.string().optional().title('Domain').describe('The domain of the created company'),
        phoneNumber: z.string().optional().title('Phone Number').describe('The phone number of the created company'),
      }),
    },
    companyDeleted: {
      title: 'Company Deleted',
      description: 'A company has been deleted in Hubspot.',
      schema: z.object({
        companyId: z.string().title('Company ID').describe('The ID of the deleted company'),
      }),
    },
    ticketCreated: {
      title: 'Ticket Created',
      description: 'A new ticket has been created in Hubspot.',
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The ID of the created ticket'),
        subject: z.string().optional().title('Subject').describe('The subject of the created ticket'),
        priority: z.string().optional().title('Priority').describe('The priority of the created ticket'),
        category: z.string().optional().title('Category').describe('The category of the created ticket'),
        pipeline: z.string().title('Pipeline').describe('The pipeline of the created ticket'),
        stage: z.string().title('Stage').describe('The stage of the created ticket'),
      }),
    },
    ticketDeleted: {
      title: 'Ticket Deleted',
      description: 'A ticket has been deleted in Hubspot.',
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The ID of the deleted ticket'),
      }),
    },
  },
  states,
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Hubspot app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Hubspot app',
    },
  },
})
