import z from 'zod'

import { partialCustomer } from './sub-schemas'

export const createPaymentLinkInputSchema = z.object({
  productName: z.string().describe('The name of the product to be sold.'),
  unit_amount: z
    .number()
    .optional()
    .default(0)
    .describe(
      'The unit amount of the price in the smallest currency (e.g. 1000 cents for USD) (Optional: If the product already has a previously defined single price.).'
    ),
  currency: z
    .string()
    .optional()
    .default('usd')
    .describe(
      'The currency in which the price will be expressed (Optional) (Default: "usd")'
    ),
  quantity: z
    .number()
    .optional()
    .default(1)
    .describe(
      'The quantity of the product being purchased (Optional) (Default: 1).'
    ),
  adjustableQuantity: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true if the quantity can be adjusted to any non-negative Integer (Optional) (Default: false).'
    ),
  adjustableQuantityMaximum: z
    .number()
    .min(2)
    .max(999)
    .optional()
    .default(99)
    .describe(
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (Optional) (Default: 99).'
    ),
  adjustableQuantityMinimum: z
    .number()
    .min(1)
    .max(998)
    .optional()
    .default(1)
    .describe(
      'The minimum quantity the customer can purchase. (Optional) (Default: 1).'
    ),
})

export const createPaymentLinkOutputSchema = z
  .object({
    id: z.string(),
    url: z.string(),
  })
  .partial()

export const listProductPricesInputSchema = z.object({})

export const listProductPricesOutputSchema = z
  .object({
    products: z.record(
      z.object({
        name: z.string(),
        prices: z.array(
          z.object({
            unit_amount: z.number().nullable(),
            currency: z.string(),
            recurring: z.object({}).passthrough().nullable().optional(),
          })
        ),
      })
    ),
  })
  .partial()

export const createSubsLinkInputSchema = z.object({
  productName: z.string().describe('The name of the subscription product.'),
  unit_amount: z
    .number()
    .optional()
    .default(0)
    .describe(
      'The unit amount of the price in the smallest currency unit (e.g., 1000 cents for USD) (Optional: If the product already has a previously defined single price).'
    ),
  currency: z
    .string()
    .optional()
    .default('usd')
    .describe(
      'The currency in which the price will be expressed (Optional) (Default: "usd")'
    ),
  quantity: z
    .number()
    .optional()
    .default(1)
    .describe(
      'The quantity of the product being purchased (Optional) (Default: 1).'
    ),
  adjustableQuantity: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true if the quantity can be adjusted to any non-negative Integer (Optional) (Default: false).'
    ),
  adjustableQuantityMaximum: z
    .number()
    .min(2)
    .max(999)
    .optional()
    .default(99)
    .describe(
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (Optional) (Default: 99).'
    ),
  adjustableQuantityMinimum: z
    .number()
    .min(1)
    .max(998)
    .optional()
    .default(1)
    .describe(
      'The minimum quantity the customer can purchase. (Optional) (Default: 1).'
    ),
  chargingInterval: z
    .string()
    .optional()
    .default('month')
    .describe(
      'The charging interval for the subscription. Can be "day", "week", "month", or "year". (Optional) (Default: "month")'
    ),
  trial_period_days: z
    .number()
    .min(1)
    .optional()
    .describe('The number of free trial days for the subscription. (Optional)'),
  description: z
    .string()
    .optional()
    .describe(
      "The subscription's description, meant to be displayable to the customer. Use this field to optionally store an explanation of the subscription."
    ),
})

export const createSubsLinkOutputSchema = z
  .object({
    id: z.string(),
    url: z.string(),
  })
  .partial()

export const listPaymentLinksInputSchema = z.object({})

export const listPaymentLinksOutputSchema = z
  .object({
    paymentLinks: z.array(
      z.object({
        id: z.string(),
        url: z.string(),
      })
    ),
  })
  .partial()

export const findPaymentLinkInputSchema = z.object({
  url: z.string().describe('PaymentLink URL'),
})

export const findPaymentLinkOutputSchema = z
  .object({
    id: z.string(),
  })
  .partial()

export const deactivatePaymentLinkInputSchema = z.object({
  id: z.string().describe('Paymentlink ID to deactivate'),
})

export const deactivatePaymentLinkOutputSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    active: z.boolean(),
  })
  .partial()

export const listCustomersInputSchema = z.object({
  email: z
    .string()
    .email()
    .max(512)
    .optional()
    .describe('e-mail for the Customer (Optional) (e.g. John.Doe@mail.com)'),
})

export const listCustomersOutputSchema = z
  .object({
    customers: z.record(z.array(partialCustomer)),
  })
  .partial()

export const searchCustomersInputSchema = z.object({
  email: z
    .string()
    // .email()
    .max(512)
    .optional()
    .describe(
      'e-mail substring for the Customer (Optional) (e.g. John for John.Doe@mail.com)'
    ),
  name: z
    .string()
    .optional()
    .describe('Name substring for the Customer (Optional)'),
  phone: z
    .string()
    .optional()
    .describe(
      'Phone substring for the Customer (Optional) (e.g. 99 for +19999999999)'
    ),
})

export const searchCustomersOutputSchema = z
  .object({
    customers: z.array(partialCustomer),
  })
  .partial()

export const createCustomerInputSchema = z.object({
  email: z
    .string()
    .email()
    .max(512)
    .describe('The email of the customer (e.g. John.Doe@mail.com)'),
  name: z.string().optional().describe('The name of the customer (Optional).'),
  phone: z
    .string()
    .optional()
    .describe(
      'The phone number of the customer (Optional) (e.g. +19999999999)'
    ),
  description: z
    .string()
    .optional()
    .describe('A description for the customer (Optional).'),
  paymentMethodId: z
    .string()
    .optional()
    .describe(
      'The ID of the PaymentMethod to attach to the customer. (Optional) (e.g. pm_1NqyTXDWcmVTIcloDmHa2ryH)'
    ),
  address: z
    .string()
    .optional()
    .describe(
      'The address of the customer. Must be a valid JSON string representing the address (Optional) (e.g. {"city": "San Francisco", "country": "US", "line1": "123 Main St", "line2": "", "postal_code": "94111", "state": "CA"} )'
    ),
})

export const createCustomerOutputSchema = z
  .object({
    customer: partialCustomer,
  })
  .partial()

export const createOrRetrieveCustomerInputSchema = createCustomerInputSchema

export const createOrRetrieveCustomerOutputSchema = z
  .object({
    customer: partialCustomer.optional(),
    customers: z.array(partialCustomer).optional(),
  })
  .partial()

export const retrieveCustomerByIdInputSchema = z.object({
  id: z.string().describe('Customer ID to Retrieve (e.g. cus_Oe9DKrGO7g9tk3)'),
})

export const retrieveCustomerByIdOutputSchema = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    description: z.string().nullable(),
    created: z.number(),
  })
  .passthrough()
  .partial()
