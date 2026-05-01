type VariantNode = {
  id: string
  title: string
  price: string
  sku: string | null
  inventoryQuantity: number | null
}

type ProductNode = {
  id: string
  title: string
  handle: string
  status: string
  vendor: string | null
  productType: string | null
  descriptionHtml: string | null
  createdAt: string
  updatedAt: string
  onlineStoreUrl: string | null
  onlineStorePreviewUrl: string | null
  variants: { edges: Array<{ node: VariantNode }> }
}

type MoneyV2 = {
  amount: string
  currencyCode: string
}

type CustomerNode = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  numberOfOrders?: string | number | null
  amountSpent?: MoneyV2 | null
  createdAt: string
  updatedAt: string
}

type LineItemNode = {
  title: string
  quantity: number
  variant?: VariantNode | null
}

type OrderNode = {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
  closedAt: string | null
  displayFinancialStatus: string | null
  displayFulfillmentStatus: string | null
  totalPriceSet: { shopMoney: MoneyV2 }
  lineItems: { edges: Array<{ node: LineItemNode }> }
  customer?: CustomerNode | null
}

export const transformVariant = (node: VariantNode) => ({
  id: node.id,
  title: node.title,
  price: node.price,
  sku: node.sku ?? undefined,
  inventoryQuantity: node.inventoryQuantity ?? undefined,
})

export const transformProduct = (node: ProductNode, shopDomain: string) => ({
  id: node.id,
  title: node.title,
  handle: node.handle,
  status: node.status,
  vendor: node.vendor ?? undefined,
  productType: node.productType ?? undefined,
  descriptionHtml: node.descriptionHtml ?? undefined,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt,
  storefrontUrl:
    node.onlineStoreUrl ?? node.onlineStorePreviewUrl ?? `https://${shopDomain}.myshopify.com/products/${node.handle}`,
  onlineStoreUrl: node.onlineStoreUrl ?? undefined,
  onlineStorePreviewUrl: node.onlineStorePreviewUrl ?? undefined,
  variants: node.variants.edges.map(({ node: variant }) => transformVariant(variant)),
})

export const transformCustomer = (node: CustomerNode) => ({
  id: node.id,
  firstName: node.firstName ?? undefined,
  lastName: node.lastName ?? undefined,
  email: node.email ?? undefined,
  phone: node.phone ?? undefined,
  numberOfOrders: node.numberOfOrders != null ? Number(node.numberOfOrders) : undefined,
  amountSpent: node.amountSpent ? `${node.amountSpent.amount} ${node.amountSpent.currencyCode}` : undefined,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt,
})

export const transformLineItem = (node: LineItemNode) => ({
  title: node.title,
  quantity: node.quantity,
  variant: node.variant ? transformVariant(node.variant) : undefined,
})

export const transformOrder = (node: OrderNode) => ({
  id: node.id,
  name: node.name,
  email: node.email ?? undefined,
  phone: node.phone ?? undefined,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt,
  cancelledAt: node.cancelledAt ?? undefined,
  closedAt: node.closedAt ?? undefined,
  financialStatus: node.displayFinancialStatus ?? 'UNKNOWN',
  fulfillmentStatus: node.displayFulfillmentStatus ?? undefined,
  totalPrice: node.totalPriceSet.shopMoney.amount,
  currencyCode: node.totalPriceSet.shopMoney.currencyCode,
  lineItems: node.lineItems.edges.map(({ node: lineItem }) => transformLineItem(lineItem)),
  customer: node.customer ? transformCustomer(node.customer) : undefined,
})

// Shopify REST/webhook order payload — only the fields we surface in orderEventSchema.
// Reference: https://shopify.dev/docs/api/webhooks?reference=admin#topic-orders-create
export type OrderWebhookPayload = {
  id: number
  name: string
  email: string | null
  financial_status: string | null
  fulfillment_status: string | null
  total_price: string
  currency: string
  created_at: string
  updated_at: string
}

export const transformOrderWebhookPayload = (payload: OrderWebhookPayload) => ({
  id: `gid://shopify/Order/${payload.id}`,
  name: payload.name,
  email: payload.email ?? undefined,
  financialStatus: payload.financial_status ?? 'UNKNOWN',
  fulfillmentStatus: payload.fulfillment_status ?? undefined,
  totalPrice: payload.total_price,
  currencyCode: payload.currency,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
})
