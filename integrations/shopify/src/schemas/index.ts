import { INTEGRATION_NAME } from 'src/const'
import z from 'zod'

export const orderCreatedSchema = z.object({
  type: z.literal(`${INTEGRATION_NAME}:orderCreated`).optional(),
  order_id: z.number(),
  shopName: z.string(),
  confirmation_number: z.string(),
  created_at: z.string(),
  currency: z.string().optional(),
  current_subtotal_price: z.string().optional(),
  current_total_discounts: z.string().optional(),
  current_total_price: z.string().optional(),
  current_total_tax: z.string().optional(),
  customer_locale: z.string().optional(),
  order_status_url: z.string().optional(),
  fullBody: z.object({}).passthrough(),
})

export type orderCreated = z.infer<typeof orderCreatedSchema>

export const orderCancelledSchema = z.object({
  type: z.literal(`${INTEGRATION_NAME}:orderCancelled`).optional(),
  order_id: z.number(),
  shopName: z.string(),
  cancel_reason: z.string(),
  closed_at: z.string().optional(),
  currency: z.string().optional(),
  current_subtotal_price: z.string().optional(),
  current_total_discounts: z.string().optional(),
  current_total_price: z.string().optional(),
  current_total_tax: z.string().optional(),
  customer_locale: z.string().optional(),
  order_status_url: z.string().optional(),
  fullBody: z.object({}).passthrough(),
})

export type orderCancelled = z.infer<typeof orderCancelledSchema>

export const newCustomerSchema = z.object({
  type: z.literal(`${INTEGRATION_NAME}:newCustomer`).optional(),
  shopName: z.string(),
  id: z.number(),
  email: z.string().nullable().optional(),
  accepts_marketing: z.boolean().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  orders_count: z.number().nullable().optional(),
  state: z.string().nullable().optional(),
  total_spent: z.string().nullable().optional(),
  last_order_id: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export type newCustomer = z.infer<typeof newCustomerSchema>
