import { IntegrationDefinitionProps } from '@botpress/sdk'
import { newCustomerSchema, orderCancelledSchema, orderCreatedSchema } from 'src/schemas'
import z from 'zod'

export type OrderCreated = z.infer<typeof orderCreated.schema>

const orderCreated = {
  schema: orderCreatedSchema,
  ui: {},
}

export type OrdeCancelled = z.infer<typeof orderCancelled.schema>

const orderCancelled = {
  schema: orderCancelledSchema,
  ui: {},
}

export type NewCustomer = z.infer<typeof newCustomer.schema>

const newCustomer = {
  schema: newCustomerSchema,
  ui: {},
}

export const events = {
  orderCreated,
  orderCancelled,
  newCustomer,
} satisfies IntegrationDefinitionProps['events']
