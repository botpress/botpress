import { z } from '@botpress/sdk'

export const productVariantSchema = z.object({
  id: z.string().title('Variant ID').describe('The Shopify GID of the product variant'),
  title: z.string().title('Title').describe('The title of the variant'),
  price: z.string().title('Price').describe('The price of the variant'),
  sku: z.string().optional().title('SKU').describe('The SKU of the variant'),
  inventoryQuantity: z.number().optional().title('Inventory Quantity').describe('The available inventory'),
})

export const productSchema = z.object({
  id: z.string().title('Product ID').describe('The Shopify GID of the product'),
  title: z.string().title('Title').describe('The title of the product'),
  handle: z.string().title('Handle').describe('The URL-friendly handle of the product'),
  status: z.string().title('Status').describe('The status of the product (ACTIVE, ARCHIVED, DRAFT)'),
  vendor: z.string().optional().title('Vendor').describe('The vendor of the product'),
  productType: z.string().optional().title('Product Type').describe('The product type'),
  descriptionHtml: z.string().optional().title('Description HTML').describe('The HTML description'),
  createdAt: z.string().title('Created At').describe('When the product was created'),
  updatedAt: z.string().title('Updated At').describe('When the product was last updated'),
  storefrontUrl: z
    .string()
    .title('Storefront URL')
    .describe("Canonical storefront URL on the shop's myshopify.com domain — always populated"),
  onlineStoreUrl: z
    .string()
    .optional()
    .title('Online Store URL')
    .describe(
      'Published Online Store URL (may use a custom domain). Undefined if the product is not published to the Online Store sales channel'
    ),
  onlineStorePreviewUrl: z
    .string()
    .optional()
    .title('Online Store Preview URL')
    .describe('Preview URL that works even when the product is not published'),
  variants: z.array(productVariantSchema).title('Variants').describe('The product variants'),
})

export const customerSchema = z.object({
  id: z.string().title('Customer ID').describe('The Shopify GID of the customer'),
  firstName: z.string().optional().title('First Name').describe('The first name of the customer'),
  lastName: z.string().optional().title('Last Name').describe('The last name of the customer'),
  email: z.string().optional().title('Email').describe('The email address of the customer'),
  phone: z.string().optional().title('Phone').describe('The phone number of the customer'),
  numberOfOrders: z.number().optional().title('Number of Orders').describe('Total number of orders'),
  amountSpent: z.string().optional().title('Amount Spent').describe('Total amount spent'),
  createdAt: z.string().title('Created At').describe('When the customer was created'),
  updatedAt: z.string().title('Updated At').describe('When the customer was last updated'),
})

export const orderLineItemSchema = z.object({
  title: z.string().title('Title').describe('The title of the line item'),
  quantity: z.number().title('Quantity').describe('The quantity ordered'),
  variant: productVariantSchema.optional().title('Variant').describe('The associated product variant'),
})

export const orderSchema = z.object({
  id: z.string().title('Order ID').describe('The Shopify GID of the order'),
  name: z.string().title('Order Number').describe('The order number (e.g. #1001)'),
  email: z.string().optional().title('Email').describe('The email associated with the order'),
  phone: z.string().optional().title('Phone').describe('The phone number associated with the order'),
  createdAt: z.string().title('Created At').describe('When the order was created'),
  updatedAt: z.string().title('Updated At').describe('When the order was last updated'),
  cancelledAt: z.string().optional().title('Cancelled At').describe('When the order was cancelled'),
  closedAt: z.string().optional().title('Closed At').describe('When the order was closed'),
  financialStatus: z.string().title('Financial Status').describe('The financial status of the order'),
  fulfillmentStatus: z.string().optional().title('Fulfillment Status').describe('The fulfillment status'),
  totalPrice: z.string().title('Total Price').describe('The total price of the order'),
  currencyCode: z.string().title('Currency Code').describe('The currency code (e.g. USD)'),
  lineItems: z.array(orderLineItemSchema).title('Line Items').describe('The order line items'),
  customer: customerSchema.optional().title('Customer').describe('The customer who placed the order'),
})

export const orderEventSchema = z.object({
  id: z.string().title('Order ID').describe('The Shopify order ID'),
  name: z.string().title('Order Number').describe('The order number (e.g. #1001)'),
  email: z.string().optional().title('Email').describe('The email associated with the order'),
  financialStatus: z.string().title('Financial Status').describe('The financial status'),
  fulfillmentStatus: z.string().optional().title('Fulfillment Status').describe('The fulfillment status'),
  totalPrice: z.string().title('Total Price').describe('The total price of the order'),
  currencyCode: z.string().title('Currency Code').describe('The currency code'),
  createdAt: z.string().title('Created At').describe('When the order was created'),
  updatedAt: z.string().title('Updated At').describe('When the order was last updated'),
})

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean().title('Has Next Page').describe('Whether there are more results'),
  endCursor: z.string().optional().title('End Cursor').describe('Cursor for the next page'),
})
