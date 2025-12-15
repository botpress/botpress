import type { ActionDefinition } from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { UberUUID, UberOrderState, UberOrderStatus, UberDenyReason } from './constants'

const UberOrderSchema = z.object({
  id: UberUUID.optional(),
  displayId: z.string().optional(),
  externalId: z.string().optional(),
  state: UberOrderState.optional(),
  status: UberOrderStatus.optional(),
  storeId: UberUUID.optional(),
  createdAt: z.string().optional(),
  scheduledOrderStartTime: z.string().optional(),
  scheduledOrderEndTime: z.string().optional(),
})

export const acceptOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const acceptOrderActionOutputSchema = z.object({}).describe('Empty response on success')

export const denyOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  reason: UberDenyReason.optional().describe('Reason for denying the order'),
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
  order: UberOrderSchema,
})

export const listStoreOrdersActionInputSchema = z.object({
  expand: z.string().optional().describe('Comma-separated: carts,deliveries,payment'),
  state: z.array(UberOrderState).optional(),
  status: z.array(UberOrderStatus).optional(),
  startTime: z.string().optional().describe('RFC3339 timestamp (created after)'),
  endTime: z.string().optional().describe('RFC3339 timestamp (created before)'),
  nextToken: z.string().optional().describe('Pagination cursor from the previous response (optional)'),
  pageSize: z.number().int().min(1).max(50).optional().describe('Orders per page (max 50, default 50)'),
})

export const listStoreOrdersActionOutputSchema = z.object({
  orders: z.array(UberOrderSchema).describe('Orders returned in this page'),
  nextToken: z.string().optional().describe('Cursor to fetch the next page (if available)'),
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
