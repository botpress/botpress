import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

type ActionDefinition = NonNullable<IntegrationDefinitionProps['actions']>[string]

const getProducts = {
  title: 'Get Products List',
  description: 'Gets a list of all products based on the parameters',
  input: {
    schema: z.object({
      ids: z.string().optional().describe('Comma-separated list of product IDs.'),
      limit: z
        .number()
        .min(0)
        .max(250)
        .default(50)
        .optional()
        .describe('Return up to this many results per page. Default is 50, Maximum is 250'),
      title: z.string().optional().describe('The exact product title.'),
      product_type: z.string().optional().describe('Exact product type.'),
    }),
    ui: {
      ids: {
        title: 'Product ID(s)',
        examples: ['632910392', '632910392,632910391'],
      },
      limit: {
        title: 'Limit',
      },
      title: {
        title: 'Product Title',
      },
      product_type: {
        title: 'Product Type',
      },
    },
  },
  output: {
    schema: z.object({
      productsList: z.array(z.object({}).passthrough()),
    }),
  },
} satisfies ActionDefinition

const getProductVariants = {
  title: 'Get Product Variants List',
  description: 'Gets a list of all product variants based on the parameters',
  input: {
    schema: z.object({
      product_id: z.string().optional().describe('The product ID to retrieve its variants'),
      limit: z
        .number()
        .min(0)
        .max(250)
        .default(50)
        .optional()
        .describe('Return up to this many results per page. Default is 50, Maximum is 250'),
    }),
    ui: {
      product_id: {
        title: 'Product ID(s)',
        examples: ['632910392', '632910392,632910391'],
      },
      limit: {
        title: 'Limit',
      },
    },
  },
  output: {
    schema: z.object({
      productVariantsList: z.array(z.object({}).passthrough()),
    }),
  },
} satisfies ActionDefinition

const getCustomers = {
  title: 'Get Customers List',
  description: 'Gets a list of all customers based on the parameters',
  input: {
    schema: z.object({
      ids: z.string().optional().describe('Comma-separated list of customers IDs.'),
      limit: z
        .number()
        .min(0)
        .max(250)
        .default(50)
        .optional()
        .describe('Return up to this many results per page. Default is 50, Maximum is 250'),
    }),
    ui: {
      ids: {
        title: 'Customer ID(s)',
        examples: ['207119551', '207119551,1073339478'],
      },
      limit: {
        title: 'Limit',
      },
    },
  },
  output: {
    schema: z.object({
      customersList: z.array(z.object({}).passthrough()),
    }),
  },
} satisfies ActionDefinition

const getCustomerOrders = {
  title: 'Get Customer Orders List',
  description: 'Gets a list of all customer orders based on the parameters',
  input: {
    schema: z.object({
      customer_id: z.string().optional().describe('The exact customer ID.'),
      status: z
        .enum(['open', 'closed', 'cancelled', 'any'])
        .optional()
        .default('open')
        .describe(
          'The status of the order. It could be any of the following variables: "open","closed","cancelled","any"'
        ),
    }),
    ui: {
      customer_id: {
        title: 'Customer ID',
        examples: ['207119551'],
      },
      status: {
        title: 'Status',
        examples: ['open', 'closed', 'cancelled', 'any'],
      },
    },
  },
  output: {
    schema: z.object({
      customerOrdersList: z.array(z.object({}).passthrough()),
    }),
  },
} satisfies ActionDefinition

export const actions = { getProducts, getProductVariants, getCustomers, getCustomerOrders }
