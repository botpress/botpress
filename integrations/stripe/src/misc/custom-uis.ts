export const createPaymentLinkUi = {
  productName: { title: 'The name of the product to be sold.' },
  unit_amount: {
    title:
      'The unit amount of the price in the smallest currency (e.g. 1000 cents for USD) (Optional: If the product already has a previously defined single price.).',
  },
  currency: {
    title:
      'The currency in which the price will be expressed (Optional) (Default: "usd")',
  },
  quantity: {
    title:
      'The quantity of the product being purchased (Optional) (Default: 1).',
  },
  adjustableQuantity: {
    title:
      'Set to true if the quantity can be adjusted to any non-negative Integer (Optional) (Default: false).',
  },
  adjustableQuantityMaximum: {
    title:
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (Optional) (Default: 99).',
  },
  adjustableQuantityMinimum: {
    title:
      'The minimum quantity the customer can purchase. (Optional) (Default: 1).',
  },
}

export const createSubsLinkUi = {
  productName: { title: 'The name of the subscription product.' },
  unit_amount: {
    title:
      'The unit amount of the price in the smallest currency unit (e.g., 1000 cents for USD) (Optional: If the product already has a previously defined single price).',
  },
  currency: {
    title:
      'The currency in which the price will be expressed (Optional) (Default: "usd")',
  },
  quantity: {
    title:
      'The quantity of the product being purchased (Optional) (Default: 1).',
  },
  adjustableQuantity: {
    title:
      'Set to true if the quantity can be adjusted to any non-negative Integer (Optional) (Default: false).',
  },
  adjustableQuantityMaximum: {
    title:
      'The maximum quantity the customer can purchase. You can specify a value up to 999 (Optional) (Default: 99).',
  },
  adjustableQuantityMinimum: {
    title:
      'The minimum quantity the customer can purchase. (Optional) (Default: 1).',
  },
  chargingInterval: {
    title:
      'The charging interval for the subscription. Can be "day", "week", "month", or "year". (Optional) (Default: "month")',
  },
  trial_period_days: {
    title: 'The number of free trial days for the subscription. (Optional)',
  },
}

export const listProductPricesUi = {}

export const listPaymentLinksUi = {}

export const findPaymentLinkUi = {
  url: { title: 'PaymentLink URL' },
}

export const deactivatePaymentLinkUi = {
  id: { title: 'Paymentlink ID to deactivate' },
}

export const listCustomersUi = {
  email: {
    title: 'e-mail for the Customer (Optional) (e.g. John.Doe@mail.com)',
  },
}

export const searchCustomersUi = {
  email: {
    title:
      'e-mail substring for the Customer (Optional) (e.g. John for John.Doe@mail.com)',
  },
  name: {
    title: 'Name substring for the Customer (Optional)',
  },
  phone: {
    title:
      'Phone substring for the Customer (Optional) (e.g. 99 for +19999999999)',
  },
}

export const createCustomerUi = {
  email: {
    title: 'The email of the customer (e.g. John.Doe@mail.com)',
  },
  name: {
    title: 'The name of the customer (Optional)',
  },
  phone: {
    title: 'The phone number of the customer (Optional) (e.g. +19999999999)',
  },
  description: {
    title: 'A description for the customer (Optional)',
  },
  paymentMethodId: {
    title:
      'The ID of the PaymentMethod to attach to the customer. (Optional) (e.g. pm_1NqyTXDWcmVTIcloDmHa2ryH)',
  },
  address: {
    title:
      'The address of the customer. Must be a valid JSON string representing the address (Optional) (e.g. {"city": "San Francisco", "country": "US", "line1": "123 Main St", "line2": "", "postal_code": "94111", "state": "CA"} )',
  },
}

export const createOrRetrieveCustomerUi = createCustomerUi

export const retrieveCustomerByIdUi = {
  id: { title: 'Customer ID to Retrieve (e.g. cus_Oe9DKrGO7g9tk3)' },
}
