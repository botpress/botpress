import z from 'zod'

const baseSchema = z.object({
  origin: z.literal('stripe').describe('The origin of the event trigger'),
  userId: z.string().uuid().describe('Botpress User ID'),
})

const chargeFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('charge.failed'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the failed charge'),
    })
    .describe('The data to send with the event'),
})

const subscriptionDeletedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('customer.subscription.deleted'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the deleted subscription'),
    })
    .describe('The data to send with the event'),
})

const subscriptionUpdatedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('customer.subscription.updated'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the updated subscription'),
    })
    .describe('The data to send with the event'),
})

const invoicePaymentFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('invoice.payment_failed'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the invoice whose payment failed'),
    })
    .describe('The data to send with the event'),
})

const paymentIntentFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('payment_intent.payment_failed'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the payment intent that failed'),
    })
    .describe('The data to send with the event'),
})

export {
  chargeFailedSchema,
  subscriptionDeletedSchema,
  subscriptionUpdatedSchema,
  invoicePaymentFailedSchema,
  paymentIntentFailedSchema,
}
