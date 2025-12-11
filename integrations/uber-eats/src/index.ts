import { UberEatsClient } from './api/uber-client'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const uber = new UberEatsClient({
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
      bpClient: client,
      ctx,
    })

    await uber.testConnection()

    logger.forBot().info('Uber Eats credentials validated.')
  },

  unregister: async () => {},
  actions: {
    getOrders: async (props) => {
      props.logger.forBot().info('Mock: Fetching recent Uber Eats orders...')

      // Mock fake orders
      return {
        orders: [
          {
            id: 'order_123',
            status: 'PLACED',
            items: [{ name: 'Pizza', qty: 1 }],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'order_456',
            status: 'NEW',
            items: [{ name: 'Burger', qty: 2 }],
            createdAt: new Date().toISOString(),
          },
        ],
      }
    },

    acceptOrder: async (props) => {
      const { orderId } = props.input
      props.logger.forBot().info(`Mock: Accepting order ${orderId}...`)

      // Pretend we called Uber API
      await new Promise((resolve) => setTimeout(resolve, 300)) // fake latency

      return {}
    },
  },
  channels: {},
  handler,
})
