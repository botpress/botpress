import { z, type ActionDefinition } from '@botpress/sdk'
import { UberUUID, UberOrderState, UberOrderStatus, UberDenyReason } from 'src/definitions/constants'

const UberOrderSchema = z
  .object({
    id: UberUUID.optional().title('Order ID').describe('Uber order UUID'),
    displayId: z.string().optional().title('Display ID').describe('Human-readable order identifier'),
    externalId: z.string().optional().title('External ID').describe('Partner-defined external order identifier'),
    state: UberOrderState.optional().title('Order state').describe('Order state'),
    status: UberOrderStatus.optional().title('Order status').describe('Order status'),
    storeId: UberUUID.optional().title('Store ID').describe('Uber Eats store UUID'),
    createdAt: z.string().optional().title('Created at').describe('RFC3339 timestamp when the order was created'),
    scheduledOrderStartTime: z
      .string()
      .optional()
      .title('Scheduled start time')
      .describe('RFC3339 timestamp when a scheduled order window starts'),
    scheduledOrderEndTime: z
      .string()
      .optional()
      .title('Scheduled end time')
      .describe('RFC3339 timestamp when a scheduled order window ends'),
  })
  .describe('Uber Eats order summary')

export const UberDenyReasonSchema = z
  .object({
    type: UberDenyReason.optional().title('Reason type').describe('Category of cancellation'),
    info: z.string().optional().title('Additional info').describe('Additional free-text explanation'),
    clientErrorCode: z.string().optional().title('Client error code').describe('Partner-provided error code'),
  })
  .describe('Reason used to deny an order')

export const acceptOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const acceptOrderActionOutputSchema = z.object({}).describe('Empty response on success')

export const denyOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  reason: UberDenyReasonSchema.title('Deny reason').describe('Reason for denying the order'),
})

export const denyOrderActionOutputSchema = z.object({}).describe('Empty response on success')

export const markOrderReadyActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const markOrderReadyActionOutputSchema = z.object({}).describe('Empty response on success')

export const getOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const getOrderActionOutputSchema = z.object({
  order: UberOrderSchema.describe('Uber Eats order details'),
})

export const listStoreOrdersActionInputSchema = z.object({
  expand: z.string().optional().title('Expand').describe('Comma-separated expansions: carts,deliveries,payment'),
  state: z.array(UberOrderState).optional().title('Order state').describe('Filter by order state'),
  status: z.array(UberOrderStatus).optional().title('Order status').describe('Filter by order status'),
  startTime: z
    .string()
    .optional()
    .title('Start time')
    .describe('RFC3339 timestamp: include orders created after this time'),
  endTime: z
    .string()
    .optional()
    .title('End time')
    .describe('RFC3339 timestamp: include orders created before this time'),
  nextToken: z
    .string()
    .optional()
    .title('Next page token')
    .describe('Pagination cursor returned by a previous call (optional)'),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .title('Page size')
    .describe('Orders per page (max 50, default 50)'),
})

export const listStoreOrdersActionOutputSchema = z.object({
  orders: z.array(UberOrderSchema).title('Orders').describe('Orders returned in this page'),
  nextToken: z.string().optional().title('Next page token').describe('Cursor to fetch the next page (if available)'),
})

export const getOrder: ActionDefinition = {
  title: 'Get Order',
  description: 'Fetch a single Uber Eats order by ID.',
  input: { schema: getOrderActionInputSchema },
  output: { schema: getOrderActionOutputSchema },
}

export const listStoreOrders: ActionDefinition = {
  title: 'List Store Orders',
  description: 'List orders for the configured store with optional state/status filters.',
  input: { schema: listStoreOrdersActionInputSchema },
  output: { schema: listStoreOrdersActionOutputSchema },
}

export const acceptOrder: ActionDefinition = {
  title: 'Accept Order',
  description: 'Accept an incoming Uber Eats order.',
  input: { schema: acceptOrderActionInputSchema },
  output: { schema: acceptOrderActionOutputSchema },
}

export const denyOrder: ActionDefinition = {
  title: 'Deny Order',
  description: 'Deny an Uber Eats order.',
  input: { schema: denyOrderActionInputSchema },
  output: { schema: denyOrderActionOutputSchema },
}

export const markOrderReady: ActionDefinition = {
  title: 'Mark Order Ready',
  description: 'Mark an order as ready for pickup.',
  input: { schema: markOrderReadyActionInputSchema },
  output: { schema: markOrderReadyActionOutputSchema },
}

export const actions = {
  getOrder,
  listStoreOrders,
  acceptOrder,
  denyOrder,
  markOrderReady,
} as const
