import { IntegrationDefinitionProps } from '@botpress/sdk'
import { orderEventSchema } from './schemas'

export const events = {
  orderCreated: {
    title: 'Order Created',
    description: 'Triggered when a new order is placed',
    schema: orderEventSchema,
  },
  orderUpdated: {
    title: 'Order Updated',
    description: 'Triggered when an order is modified',
    schema: orderEventSchema,
  },
  orderCancelled: {
    title: 'Order Cancelled',
    description: 'Triggered when an order is cancelled',
    schema: orderEventSchema,
  },
  orderFulfilled: {
    title: 'Order Fulfilled',
    description: 'Triggered when all items in an order are fulfilled',
    schema: orderEventSchema,
  },
  orderPaid: {
    title: 'Order Paid',
    description: 'Triggered when payment for an order is confirmed',
    schema: orderEventSchema,
  },
} satisfies IntegrationDefinitionProps['events']
