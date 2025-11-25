import { z } from '@botpress/sdk'

const partialCustomer = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable().optional(),
    description: z.string().nullable(),
    phone: z.string().nullable().optional(),
    address: z.object({}).passthrough().nullable().optional(),
    created: z.number(),
    delinquent: z.boolean().nullable().optional(),
  })
  .passthrough()

export const createPaymentLinkInputSchema = z.object({
  productName: z
    .string()
    .title('Product Name')
    .placeholder('ex: T-Shirt')
    .describe('The name of the product to be sold'),
  unit_amount: z
    .number()
    .title('Unit Price')
    .min(50, 'Amount must be at least 50 cents ($0.50 USD)')
    .optional()
    .default(50)
    .describe('The unit price in cents (minimum 50 cents for USD)'),
  currency: z
    .string()
    .title('Currency')
    .optional()
    .default('usd')
    .describe('The currency in which the price will be expressed'),
  quantity: z.number().title('Quantity').optional().default(1).describe('The quantity of the product being purchased'),
  adjustableQuantity: z
    .boolean()
    .title('Adjustable Quantity')
    .optional()
    .default(false)
    .describe('Whether or not the quantity can be adjusted'),
  adjustableQuantityMaximum: z
    .number()
    .title('Max Quantity')
    .min(2)
    .max(999)
    .optional()
    .default(99)
    .describe('The maximum quantity the customer can purchase, up to 999'),
  adjustableQuantityMinimum: z
    .number()
    .title('Min Quantity')
    .min(1)
    .max(998)
    .optional()
    .default(1)
    .describe('The minimum quantity the customer can purchase'),
})

export const createPaymentLinkOutputSchema = z
  .object({
    id: z.string().describe('The ID of the created payment link'),
    url: z.string().describe('The URL of the created payment link'),
  })
  .partial()

export const listProductPricesInputSchema = z.object({})

export const listProductPricesOutputSchema = z
  .object({
    products: z
      .record(
        z.object({
          name: z.string().describe('The name of the product'),
          prices: z
            .array(
              z.object({
                unit_amount: z.number().nullable().describe('The unit amount for the product'),
                currency: z.string().describe('The currency for the product'),
                recurring: z.object({}).passthrough().nullable().optional().describe('Recurring price details'),
              })
            )
            .describe('A list of prices for the product'),
        })
      )
      .describe('A record of products and their prices'),
  })
  .partial()

export const createSubsLinkInputSchema = z.object({
  productName: z.string().title('Product Name').describe('The name of the subscription product'),
  unit_amount: z.number().title('Unit Amount').optional().default(0).describe('The unit price in cents'),
  currency: z
    .string()
    .title('Currency')
    .optional()
    .default('usd')
    .describe('The currency in which the price is expressed'),
  quantity: z
    .number()
    .title('Quantity')
    .optional()
    .default(1)
    .describe('The quantity of the subscription being purchased'),
  adjustableQuantity: z
    .boolean()
    .title('Adjustable Quantity')
    .optional()
    .default(false)
    .describe('Whether or not the quantity can be adjusted'),
  adjustableQuantityMaximum: z
    .number()
    .title('Max Quantity')
    .min(2)
    .max(999)
    .optional()
    .default(99)
    .describe('The maximum quantity the customer can purchase, up to 999'),
  adjustableQuantityMinimum: z
    .number()
    .title('Min Quantity')
    .min(1)
    .max(998)
    .optional()
    .default(1)
    .describe('The minimum quantity the customer can purchase'),
  chargingInterval: z // change to .enum(['day', 'week', 'month', 'year'])
    .string()
    .title('Payment Interval')
    .optional()
    .default('month')
    .describe('The interval at which the customer will be charged'),
  trial_period_days: z
    .number()
    .title('Trial Period Days')
    .min(1)
    .optional()
    .describe('The number of free trial days for the subscription'),
  description: z.string().title('Description').optional().describe('A description of the subscription product'),
})

export const createSubsLinkOutputSchema = z
  .object({
    id: z.string().describe('The ID of the created subscription link'),
    url: z.string().describe('The URL of the created subscription link'),
  })
  .partial()

export const listPaymentLinksInputSchema = z.object({})

export const listPaymentLinksOutputSchema = z
  .object({
    paymentLinks: z
      .array(
        z.object({
          id: z.string().describe('The ID of the payment link'),
          url: z.string().describe('The URL of the payment link'),
        })
      )
      .describe('A list of payment links'),
  })
  .partial()

export const findPaymentLinkInputSchema = z.object({
  url: z
    .string()
    .title('Payment link')
    .describe('The URL of the payment link')
    .placeholder('ex: https://buy.stripe.com/test_b0tPr3sS5w3sOm3'),
})

export const findPaymentLinkOutputSchema = z
  .object({
    id: z.string().describe('The ID of the found payment link'),
  })
  .partial()

export const deactivatePaymentLinkInputSchema = z.object({
  id: z
    .string()
    .title('Payment Link ID')
    .describe('The payment link ID to deactivate')
    .placeholder('ex: test_aEUdTEdRP95RdvaaEJ'),
})

export const deactivatePaymentLinkOutputSchema = z
  .object({
    id: z.string().describe('The ID of the deactivated payment link'),
    url: z.string().describe('The URL of the deactivated payment link'),
    active: z.boolean().describe('Whether the payment link is active'),
  })
  .partial()

export const listCustomersInputSchema = z.object({
  email: z.string().title('Email').email().max(512).optional().describe('The e-mail of the customer to search for'),
})

export const listCustomersOutputSchema = z
  .object({
    customers: z.record(z.array(partialCustomer)).describe('A record of customers grouped by email'),
  })
  .partial()

export const searchCustomersInputSchema = z.object({
  email: z.string().title('Email').max(512).optional().describe('Search by query on customer emails'),
  name: z.string().title('Name').optional().describe('Search by query on customer name'),
  phone: z.string().title('Phone').optional().describe('Search by query on customer phone number'),
})

export const searchCustomersOutputSchema = z
  .object({
    customers: z.array(partialCustomer).describe('A list of customers matching the search criteria'),
  })
  .partial()

export const createCustomerInputSchema = z.object({
  email: z
    .string()
    .title('Email')
    .email()
    .max(512)
    .describe('The email of the customer')
    .placeholder('johndoe@botpress.com'),
  name: z.string().title('Name').optional().describe('The name of the customer').placeholder('John Doe'),
  phone: z.string().title('Phone').optional().describe('The phone number of the customer').placeholder('+1234567890'),
  description: z
    .string()
    .title('Description')
    .optional()
    .describe('A description for the customer')
    .placeholder('Customer Description'),
  paymentMethodId: z
    .string()
    .title('Payment Method ID')
    .optional()
    .describe('The ID of the payment method to attach to the customer')
    .placeholder('payment-method-id'),
  address: z
    .string()
    .title('Address')
    .optional()
    .describe('The address of the customer')
    .placeholder('123 Bot Street, Bot City, Botland, 12345'),
})

export const createCustomerOutputSchema = z
  .object({
    customer: partialCustomer.describe('The created customer object'),
  })
  .partial()

export const createOrRetrieveCustomerInputSchema = createCustomerInputSchema

export const createOrRetrieveCustomerOutputSchema = z
  .object({
    customer: partialCustomer.optional().describe('The created or retrieved customer object'),
    customers: z.array(partialCustomer).optional().describe('A list of customers matching the criteria'),
  })
  .partial()

export const retrieveCustomerByIdInputSchema = z.object({
  id: z.string().describe('The ID of the customer to retrieve').title('Customer ID').placeholder('cus_1234567890'),
})

export const retrieveCustomerByIdOutputSchema = z
  .object({
    id: z.string().describe('The ID of the retrieved customer').title('Customer ID'),
    email: z.string().describe('The email of the retrieved customer').title('Customer Email').nullable(),
    description: z
      .string()
      .describe('The description of the retrieved customer')
      .title('Customer Description')
      .nullable(),
    created: z.number().describe('The creation timestamp of the customer').title('Customer Created Timestamp'),
  })
  .passthrough()
  .partial()

const baseSchema = z.object({
  origin: z.literal('stripe').describe('The origin of the event trigger').title('Origin'),
  userId: z.string().describe('Botpress User ID').title('User ID'),
})

export const chargeFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('charge.failed'),
      object: z.object({}).passthrough().describe('The object of the failed charge').title('Charge Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const subscriptionCreatedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('customer.subscription.created'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the created subscription')
        .title('Subscription Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const subscriptionDeletedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('customer.subscription.deleted'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the deleted subscription')
        .title('Subscription Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const subscriptionUpdatedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('customer.subscription.updated'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the updated subscription')
        .title('Subscription Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const invoicePaymentFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('invoice.payment_failed'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the invoice whose payment failed')
        .title('Invoice Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const paymentIntentFailedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('payment_intent.payment_failed'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the payment intent that failed')
        .title('Payment Intent Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const subscriptionScheduleCreatedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('subscription_schedule.created'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the created subscription schedule')
        .title('Subscription Schedule Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})

export const subscriptionScheduleUpdatedSchema = baseSchema.extend({
  data: z
    .object({
      type: z.string().default('subscription_schedule.updated'),
      object: z
        .object({})
        .passthrough()
        .describe('The object of the updated subscription schedule')
        .title('Subscription Schedule Object'),
    })
    .describe('The data to send with the event')
    .title('Data'),
})
