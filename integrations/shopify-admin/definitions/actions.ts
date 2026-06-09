import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { productSchema, customerSchema, orderSchema, pageInfoSchema } from './schemas'

export const actions = {
  listProducts: {
    title: 'List Products',
    description: 'Search and list products from the Shopify Admin API',
    input: {
      schema: z.object({
        query: z.string().optional().title('Search Query').describe('Search query to filter products'),
        first: z
          .number()
          .min(1)
          .max(250)
          .default(50)
          .optional()
          .title('Limit')
          .describe('Number of products to return'),
        after: z.string().optional().title('After Cursor').describe('Cursor for pagination'),
      }),
    },
    output: {
      schema: z.object({
        products: z.array(productSchema).title('Products').describe('List of products'),
        pageInfo: pageInfoSchema.title('Page Info').describe('Pagination info'),
      }),
    },
  },

  getProduct: {
    title: 'Get Product',
    description: 'Get a single product with its variants from the Shopify Admin API',
    input: {
      schema: z.object({
        productId: z
          .string()
          .title('Product ID')
          .describe('The Shopify GID of the product (e.g. gid://shopify/Product/12345)'),
      }),
    },
    output: {
      schema: z.object({
        product: productSchema.title('Product').describe('The product details'),
      }),
    },
  },

  searchCustomers: {
    title: 'Search Customers',
    description: 'Search for customers by email, name, or phone in the Shopify Admin API',
    input: {
      schema: z.object({
        query: z.string().title('Search Query').describe('Search query (email, name, or phone)'),
      }),
    },
    output: {
      schema: z.object({
        customers: z.array(customerSchema).title('Customers').describe('List of matching customers'),
      }),
    },
  },

  getOrder: {
    title: 'Get Order',
    description: 'Get full order details by ID from the Shopify Admin API',
    input: {
      schema: z.object({
        orderId: z.string().title('Order ID').describe('The Shopify GID of the order (e.g. gid://shopify/Order/12345)'),
      }),
    },
    output: {
      schema: z.object({
        order: orderSchema.title('Order').describe('The order details'),
      }),
    },
  },

  listCustomerOrders: {
    title: 'List Customer Orders',
    description: 'List orders for a specific customer, optionally filtered by status',
    input: {
      schema: z.object({
        customerId: z
          .string()
          .title('Customer ID')
          .describe('The Shopify GID of the customer (e.g. gid://shopify/Customer/12345)'),
        status: z
          .enum(['open', 'closed', 'cancelled', 'any'])
          .default('any')
          .optional()
          .title('Status Filter')
          .describe('Filter orders by status'),
        first: z.number().min(1).max(250).default(50).optional().title('Limit').describe('Number of orders to return'),
      }),
    },
    output: {
      schema: z.object({
        orders: z.array(orderSchema).title('Orders').describe('List of customer orders'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
