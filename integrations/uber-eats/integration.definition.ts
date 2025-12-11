import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'ubereats',
  title: 'Uber Eats',
  version: '0.0.1',
  description: 'Interact with Uber Eats orders, menus, and store data.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      clientId: z.string().title('Client ID'),
      clientSecret: z.string().title('Client Secret'),
      storeId: z.string().title('Store ID').optional(),
    }),
  },
  states: {
    oauthToken: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().nullable(),
        expiresAt: z.number().nullable(),
      }),
    },
  },
  actions: {
    getOrders: {
      title: 'Get Recent Orders',
      description: 'Fetch recent orders from Uber Eats',
      input: { schema: z.object({}) },
      output: {
        schema: z.object({
          orders: z.array(z.any()),
        }),
      },
    },
    acceptOrder: {
      title: 'Accept an Order',
      description: 'Accept an incoming Uber Eats order.',
      input: {
        schema: z.object({
          orderId: z.string(),
        }),
      },
      output: { schema: z.object({}) },
    },
  },
  events: {
    orderCreated: {
      title: 'Order Created',
      description: 'Triggered when a new order is placed.',
      schema: z.object({
        orderId: z.string(),
      }),
    },
  },
})
