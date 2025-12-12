import { z } from '@botpress/sdk'
import {
  getOrderInputSchema,
  getOrderOutputSchema,
  listStoreOrdersInputSchema,
  listStoreOrdersOutputSchema,
  acceptOrderInputSchema,
  acceptOrderOutputSchema,
  denyOrderInputSchema,
  denyOrderOutputSchema,
  markOrderReadyInputSchema,
  markOrderReadyOutputSchema,
} from './api-schemas'

export type GetOrderInput = z.infer<typeof getOrderInputSchema>
export type GetOrderOutput = z.infer<typeof getOrderOutputSchema>

export type ListStoreOrdersInput = z.infer<typeof listStoreOrdersInputSchema>
export type ListStoreOrdersOutput = z.infer<typeof listStoreOrdersOutputSchema>

export type AcceptOrderInput = z.infer<typeof acceptOrderInputSchema>
export type AcceptOrderOutput = z.infer<typeof acceptOrderOutputSchema>

export type DenyOrderInput = z.infer<typeof denyOrderInputSchema>
export type DenyOrderOutput = z.infer<typeof denyOrderOutputSchema>

export type MarkOrderReadyInput = z.infer<typeof markOrderReadyInputSchema>
export type MarkOrderReadyOutput = z.infer<typeof markOrderReadyOutputSchema>
