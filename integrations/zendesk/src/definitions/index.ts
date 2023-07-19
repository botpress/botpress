import type { IntegrationDefinitionProps } from '@botpress/sdk';
import { z } from 'zod';

export { actions } from './actions';
export { events } from './events';
export { channels } from './channels';

export const configuration = {
  schema: z.object({
    baseURL: z.string({
      description:
        'Your zendesk organization URL. e.g. https://{subdomain}.zendesk.com',
    }),
    username: z.string({
      description:
        'Your zendesk account email, add "/token" to the end. e.g. jdoe@example.com/token',
    }),
    apiToken: z.string({
      description: 'Zendesk API Token',
    }),
  }),
};

export const states: IntegrationDefinitionProps['states'] = {
  subscriptionInfo: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z.string(),
    }),
  },
  ['trigger0ticketAssigned']: {
    type: 'integration',
    schema: z.object({
      triggerId: z.string(),
    }),
  },
  ['trigger0ticketSolved']: {
    type: 'integration',
    schema: z.object({
      triggerId: z.string(),
    }),
  },
  ['trigger0newMessage']: {
    type: 'integration',
    schema: z.object({
      triggerId: z.string(),
    }),
  },
};

export const user = {
  tags: { id: {} },
  creation: { enabled: true, requiredTags: ['id'] },
};
