import type { ActionDefinition } from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { UberUUID, UberOrderState, UberOrderStatus, UberDenyReason, UberReadyOrderType } from './constants'

const UberOrderSchema = z.object({
  id: UberUUID.optional(),
  display_id: z.string().optional(),
  external_id: z.string().optional(),
  state: UberOrderState.optional(),
  status: UberOrderStatus.optional(),
  store_id: UberUUID.optional(),
  created_at: z.string().optional(),
  scheduled_order_time: z.string().optional(),
})

const acceptOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

const acceptOrderActionOutputSchema = z.object({}).describe('Empty response on success')

const denyOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  reason: UberDenyReason.optional().describe('Reason for denying the order'),
})

const denyOrderActionOutputSchema = z.object({}).describe('Empty response on success')

const markOrderReadyActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  orderType: UberReadyOrderType.optional().describe('PICKUP / DELIVERY / UNKNOWN'),
})

const markOrderReadyActionOutputSchema = z.object({}).describe('Empty response on success')

const getOrderActionInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

const getOrderActionOutputSchema = z.object({
  order: UberOrderSchema,
})

const listStoreOrdersActionInputSchema = z.object({
  state: z.array(UberOrderState).optional(),
  status: z.array(UberOrderStatus).optional(),
  nextToken: z.string().optional().describe('Pagination cursor from the previous response (optional)'),
})

const listStoreOrdersActionOutputSchema = z.object({
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
