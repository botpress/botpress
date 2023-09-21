import {
  createCustomerInputSchema,
  createCustomerOutputSchema,
  createOrRetrieveCustomerInputSchema,
  createOrRetrieveCustomerOutputSchema,
  createPaymentLinkInputSchema,
  createPaymentLinkOutputSchema,
  createSubsLinkInputSchema,
  createSubsLinkOutputSchema,
  deactivatePaymentLinkInputSchema,
  deactivatePaymentLinkOutputSchema,
  findPaymentLinkInputSchema,
  findPaymentLinkOutputSchema,
  listCustomersInputSchema,
  listCustomersOutputSchema,
  listPaymentLinksInputSchema,
  listPaymentLinksOutputSchema,
  listProductPricesInputSchema,
  listProductPricesOutputSchema,
  retrieveCustomerByIdInputSchema,
  retrieveCustomerByIdOutputSchema,
  searchCustomersInputSchema,
  searchCustomersOutputSchema,
} from '../misc/custom-schemas'

import {
  createCustomerUi,
  createOrRetrieveCustomerUi,
  createPaymentLinkUi,
  createSubsLinkUi,
  deactivatePaymentLinkUi,
  findPaymentLinkUi,
  listCustomersUi,
  listPaymentLinksUi,
  listProductPricesUi,
  retrieveCustomerByIdUi,
  searchCustomersUi,
} from '../misc/custom-uis'

const createPaymentLink = {
  title: 'Create Payment Link',
  input: {
    schema: createPaymentLinkInputSchema,
    ui: createPaymentLinkUi,
  },
  output: {
    schema: createPaymentLinkOutputSchema,
  },
}

const listProductPrices = {
  title: 'List Product Prices',
  input: {
    schema: listProductPricesInputSchema,
    ui: listProductPricesUi,
  },
  output: {
    schema: listProductPricesOutputSchema,
  },
}

const createSubsLink = {
  title: 'Create Subscription Payment Link',
  input: {
    schema: createSubsLinkInputSchema,
    ui: createSubsLinkUi,
  },
  output: {
    schema: createSubsLinkOutputSchema,
  },
}

const listPaymentLinks = {
  title: 'List Payment Links',
  input: {
    schema: listPaymentLinksInputSchema,
    ui: listPaymentLinksUi,
  },
  output: {
    schema: listPaymentLinksOutputSchema,
  },
}

const findPaymentLink = {
  title: 'Find Payment Link',
  input: {
    schema: findPaymentLinkInputSchema,
    ui: findPaymentLinkUi,
  },
  output: {
    schema: findPaymentLinkOutputSchema,
  },
}

const deactivatePaymentLink = {
  title: 'Deactivate Payment Link',
  input: {
    schema: deactivatePaymentLinkInputSchema,
    ui: deactivatePaymentLinkUi,
  },
  output: {
    schema: deactivatePaymentLinkOutputSchema,
  },
}

const listCustomers = {
  title: 'List Customers By Email',
  input: {
    schema: listCustomersInputSchema,
    ui: listCustomersUi,
  },
  output: {
    schema: listCustomersOutputSchema,
  },
}

const searchCustomers = {
  title: 'Search Customers By Fields',
  input: {
    schema: searchCustomersInputSchema,
    ui: searchCustomersUi,
  },
  output: {
    schema: searchCustomersOutputSchema,
  },
}

const createCustomer = {
  title: 'Create Customer',
  input: {
    schema: createCustomerInputSchema,
    ui: createCustomerUi,
  },
  output: {
    schema: createCustomerOutputSchema,
  },
}

const createOrRetrieveCustomer = {
  title: 'Create Or Retrieve Customer',
  input: {
    schema: createOrRetrieveCustomerInputSchema,
    ui: createOrRetrieveCustomerUi,
  },
  output: {
    schema: createOrRetrieveCustomerOutputSchema,
  },
}

const retrieveCustomerById = {
  title: 'Retrieve Customer By ID',
  input: {
    schema: retrieveCustomerByIdInputSchema,
    ui: retrieveCustomerByIdUi,
  },
  output: {
    schema: retrieveCustomerByIdOutputSchema,
  },
}

export const actions = {
  createPaymentLink,
  listProductPrices,
  createSubsLink,
  listPaymentLinks,
  findPaymentLink,
  deactivatePaymentLink,
  listCustomers,
  searchCustomers,
  createCustomer,
  createOrRetrieveCustomer,
  retrieveCustomerById,
}
