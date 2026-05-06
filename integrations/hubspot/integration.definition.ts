import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { actions, states, events } from './definitions'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'HubSpot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '6.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration, use your own Hubspot app',
      schema: z.object({
        accessToken: z
          .string()
          .min(1)
          .secret()
          .title('Access Token')
          .describe('Your HubSpot Private App Access Token.'),
        clientSecret: z
          .string()
          .secret()
          .optional()
          .title('Client Secret')
          .describe('Your HubSpot app Client Secret. Used for webhook signature validation.'),
        inboxIds: z
          .array(z.string())
          .optional()
          .title('Inbox or Help Desk IDs')
          .describe(
            'List of HubSpot Inbox or Help Desk IDs. The first ID is the default. Works with both HubSpot Inbox (Sales Hub) and Help Desk (Service Hub).'
          ),
        developerApiKey: z
          .string()
          .secret()
          .optional()
          .title('Developer API Key')
          .describe('Required for HITL. Found in your HubSpot developer portal.'),
        appId: z.string().optional().title('App ID').describe('Required for HITL. The ID of your HubSpot app.'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  actions,
  events,
  states,
  entities: {
    ticket: {
      schema: z.object({
        inboxId: z.string().optional().title('Inbox ID').describe('Override the default inbox for this HITL session'),
      }),
    },
  },
  user: {
    tags: {
      email: { title: 'Email', description: 'Email address of the user' },
      phoneNumber: { title: 'Phone Number', description: 'Phone number of the user' },
      contactType: { title: 'Contact Type', description: 'Whether the user was identified by email or phone' },
      actorId: { title: 'Actor ID', description: 'HubSpot actor ID' },
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Hubspot app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Hubspot app',
    },
    DISABLE_OAUTH: {
      // TODO: Remove once the OAuth app allows for unlimited installs
      description: 'Whether to disable OAuth',
    },
    APP_ID: {
      description: 'HubSpot app ID for the Botpress OAuth app, used for Custom Channels (HITL)',
    },
    DEVELOPER_API_KEY: {
      description:
        'HubSpot developer API key (hapikey) for the Botpress OAuth app, required to create/manage Custom Channels',
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
  attributes: {
    category: 'CRM & Sales',
    guideSlug: 'hubspot',
    repo: 'botpress',
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: 'HubSpot HITL',
      description: 'Human-in-the-Loop channel for routing conversations to HubSpot agents',
      conversation: {
        tags: {
          id: { title: 'HubSpot Conversation ID', description: 'The HubSpot conversations thread ID' },
          userId: { title: 'Botpress User ID', description: 'The ID of the Botpress user for this HITL session' },
          integrationThreadId: {
            title: 'Integration Thread ID',
            description: 'The UUID used as integrationThreadId in HubSpot Custom Channel messages',
          },
          inboxId: {
            title: 'Inbox ID',
            description: 'The HubSpot inbox ID used for this HITL session',
          },
        },
      },
    },
  },
}))
