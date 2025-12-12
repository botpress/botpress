import type { ActionDefinition } from '@botpress/sdk'
import { z } from '@botpress/sdk'

import {
  UberOrderState,
  UberOrderStatus,
  UberRestaurantOrderSchema,
  UberPaginationDataSchema,
  getOrderInputSchema,
  getOrderOutputSchema,
  acceptOrderInputSchema,
  acceptOrderOutputSchema,
  denyOrderInputSchema,
  denyOrderOutputSchema,
  markOrderReadyInputSchema,
  markOrderReadyOutputSchema,
} from '../api/api-schemas'

export const getOrderActionInputSchema = getOrderInputSchema
export const getOrderActionOutputSchema = getOrderOutputSchema

export const acceptOrderActionInputSchema = acceptOrderInputSchema
export const acceptOrderActionOutputSchema = acceptOrderOutputSchema

export const listStoreOrdersActionInputSchema = z.object({
  state: z.array(UberOrderState).optional().describe('Filter by order state(s)'),
  status: z.array(UberOrderStatus).optional().describe('Filter by order status(es)'),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
})

export const listStoreOrdersActionOutputSchema = z.object({
  orders: z.array(UberRestaurantOrderSchema),
  pagination: UberPaginationDataSchema.optional(),
})

export const denyOrderActionInputSchema = denyOrderInputSchema
export const denyOrderActionOutputSchema = denyOrderOutputSchema

export const markOrderReadyActionInputSchema = markOrderReadyInputSchema
export const markOrderReadyActionOutputSchema = markOrderReadyOutputSchema

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
