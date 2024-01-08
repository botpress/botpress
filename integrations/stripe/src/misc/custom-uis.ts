export const createPaymentLinkUi = {
  productName: { title: 'The name of the product to be sold' },
  unit_amount: {
    title: 'The unit price in cents (optional)',
  },
  currency: {
    title: 'The currency in which the price will be expressed (optional)',
  },
  quantity: {
    title: 'The quantity of the product being purchased (optional)',
  },
  adjustableQuantity: {
    title:
      'Set to true if the quantity can be adjusted to any non-negative integer (optional)',
  },
  adjustableQuantityMaximum: {
    title:
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (optional)',
  },
  adjustableQuantityMinimum: {
    title: 'The minimum quantity the customer can purchase (optional)',
  },
}

export const createSubsLinkUi = {
  productName: { title: 'The name of the subscription product' },
  unit_amount: {
    title:
      'The unit amount of the price in the smallest currency unit (e.g., 1000 cents for USD) (optional: If the product already has a previously defined single price)',
  },
  currency: {
    title:
      'The currency in which the price will be expressed (optional) (Default: "usd")',
  },
  quantity: {
    title:
      'The quantity of the product being purchased (optional) (Default: 1)',
  },
  adjustableQuantity: {
    title:
      'Set to true if the quantity can be adjusted to any non-negative Integer (optional) (Default: false)',
  },
  adjustableQuantityMaximum: {
    title:
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (optional) (Default: 99)',
  },
  adjustableQuantityMinimum: {
    title:
      'The minimum quantity the customer can purchase (optional) (Default: 1)',
  },
  chargingInterval: {
    title:
      'The charging interval for the subscription. Can be "day", "week", "month", or "year" (optional) (Default: "month")',
  },
  trial_period_days: {
    title: 'The number of free trial days for the subscription (optional)',
  },
}

export const listProductPricesUi = {}

export const listPaymentLinksUi = {}

export const findPaymentLinkUi = {
  url: { title: 'Payment link URL' },
}

export const deactivatePaymentLinkUi = {
  id: { title: 'Payment link ID to deactivate' },
}

export const listCustomersUi = {
  email: {
    title: 'e-mail of the Customer (optional) (e.g. john.doe@mail.com)',
  },
}

export const searchCustomersUi = {
  email: {
    title: 'Search query on customer emails (optional)',
  },
  name: {
    title: 'Search query on customer names (optional)',
  },
  phone: {
    title: 'Search query on customer phone numbers (optional)',
  },
}

export const createCustomerUi = {
  email: {
    title: 'The email of the customer',
  },
  name: {
    title: 'The name of the customer (optional)',
  },
  phone: {
    title: 'The phone number of the customer (optional)',
  },
  description: {
    title: 'A description for the customer (optional)',
  },
  paymentMethodId: {
    title: 'The ID of the payment method to attach to the customer (optional)',
  },
  address: {
    title:
      'The address of the customer. Must be a valid JSON string representing the address (optional)',
  },
}

export const createOrRetrieveCustomerUi = createCustomerUi

export const retrieveCustomerByIdUi = {
  id: {
    title: 'Customer ID to retrieve',
  },
}
