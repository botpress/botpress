export const createPaymentLinkUi = {
  productName: {
    title: 'The name of the product to be sold',
    placeholder: 'ex: T-Shirt',
  },
  unit_amount: {
    title: 'The unit price in cents (optional)',
    placeholder: 'ex: 1000',
  },
  currency: {
    title: 'The currency in which the price will be expressed (optional)',
    placeholder: 'ex: USD',
  },
  quantity: {
    title: 'The quantity of the product being purchased (optional)',
    placeholder: 'ex: 1',
  },
  adjustableQuantity: {
    title: 'Set to true if the quantity can be adjusted to any non-negative integer (optional)',
    placeholder: 'ex: true',
  },
  adjustableQuantityMaximum: {
    title: 'The maximum quantity the customer can purchase. You can specify a value up to 999 (optional)',
    placeholder: 'ex: 10',
  },
  adjustableQuantityMinimum: {
    title: 'The minimum quantity the customer can purchase (optional)',
    placeholder: 'ex: 1',
  },
}

export const createSubsLinkUi = {
  productName: {
    title: 'The name of the subscription product',
    placeholder: 'ex: Subscription Product Name',
  },
  unit_amount: {
    title: 'The unit price in cents',
    placeholder: 'ex: 1000',
  },
  currency: {
    title: 'The currency in which the price will be expressed (optional)',
    placeholder: 'usd',
  },
  quantity: {
    title: 'The quantity of the product being purchased (optional)',
    placeholder: '1',
  },
  adjustableQuantity: {
    title: 'Set to true if the quantity can be adjusted to any non-negative Integer (optional)',
    placeholder: 'false',
  },
  adjustableQuantityMaximum: {
    title: 'The maximum quantity the customer can purchase. You can specify a value up to 999 (optional)',
    placeholder: '99',
  },
  adjustableQuantityMinimum: {
    title: 'The minimum quantity the customer can purchase (optional)',
    placeholder: '1',
  },
  chargingInterval: {
    title: 'The charging interval for the subscription. Can be "day", "week", "month", or "year" (optional)',
    placeholder: 'month',
  },
  trial_period_days: {
    title: 'The number of free trial days for the subscription (optional)',
    placeholder: 'ex: 7',
  },
  description: {
    title: 'A description for the subscription (optional)',
    placeholder: 'ex: One month subscription to the product',
  },
}

export const listProductPricesUi = {}

export const listPaymentLinksUi = {}

export const findPaymentLinkUi = {
  url: {
    title: 'Payment link URL',
    placeholder: 'ex: https://buy.stripe.com/test_b0tPr3sS5w3sOm3',
  },
}

export const deactivatePaymentLinkUi = {
  id: {
    title: 'Payment link ID to deactivate',
    placeholder: 'ex: test_aEUdTEdRP95RdvaaEJ',
  },
}

export const listCustomersUi = {
  email: {
    title: 'e-mail of the Customer (optional)',
    placeholder: 'ex: john.doe@mail.com',
  },
}

export const searchCustomersUi = {
  email: {
    title: 'Search by query on customer emails (optional)',
    placeholder: 'ex: example@example.com',
  },
  name: {
    title: 'Search by query on customer names (optional)',
    placeholder: 'ex: John Doe',
  },
  phone: {
    title: 'Search by query on customer phone numbers (optional)',
    placeholder: 'ex: +1234567890',
  },
}

export const createCustomerUi = {
  email: {
    title: 'The email of the customer',
    placeholder: 'ex: customer@example.com',
  },
  name: {
    title: 'The name of the customer (optional)',
    placeholder: 'ex: John Doe',
  },
  phone: {
    title: 'The phone number of the customer (optional)',
    placeholder: 'ex: +1234567890',
  },
  description: {
    title: 'A description for the customer (optional)',
    placeholder: 'ex: Customer Description',
  },
  paymentMethodId: {
    title: 'The ID of the payment method to attach to the customer (optional)',
    placeholder: 'ex: payment-method-id',
  },
  address: {
    title: 'The address of the customer. Must be a valid JSON string representing the address (optional)',
    placeholder: 'ex: {"street": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001"}',
  },
}

export const createOrRetrieveCustomerUi = createCustomerUi

export const retrieveCustomerByIdUi = {
  id: {
    title: 'Customer ID to retrieve',
    placeholder: 'ex: cus_PL5UYhrw7eDoLS',
  },
}
