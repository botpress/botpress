import {
  createCaseInputSchema,
  createCaseOutputSchema,
  createContactInputSchema,
  createContactOutputSchema,
  createLeadInputSchema,
  createLeadOutputSchema,
  updateCaseInputSchema,
  updateCaseOutputSchema,
  findContactInputSchema,
  findContactOutputSchema,
  findLeadInputSchema,
  findLeadOutputSchema,
} from '../misc/custom-schemas'

import {
  createCaseUi,
  createContactUi,
  createLeadUi,
  updateCaseUi,
  findContactUi,
  findLeadUi,
} from '../misc/custom-uis'

const createCase = {
  title: 'Create Case',
  input: {
    schema: createCaseInputSchema,
    ui: createCaseUi,
  },
  output: {
    schema: createCaseOutputSchema,
  },
}

const createContact = {
  title: 'Create Contact',
  input: {
    schema: createContactInputSchema,
    ui: createContactUi,
  },
  output: {
    schema: createContactOutputSchema,
  },
}

const createLead = {
  title: 'Create Lead',
  input: {
    schema: createLeadInputSchema,
    ui: createLeadUi,
  },
  output: {
    schema: createLeadOutputSchema,
  },
}

const updateCase = {
  title: 'Update Case',
  input: {
    schema: updateCaseInputSchema,
    ui: updateCaseUi,
  },
  output: {
    schema: updateCaseOutputSchema,
  },
}

const findContact = {
  title: 'Find Contact',
  input: {
    schema: findContactInputSchema,
    ui: findContactUi,
  },
  output: {
    schema: findContactOutputSchema,
  },
}

const findLead = {
  title: 'Find Lead',
  input: {
    schema: findLeadInputSchema,
    ui: findLeadUi,
  },
  output: {
    schema: findLeadOutputSchema,
  },
}

export const actions = {
  createCase,
  createContact,
  createLead,
  updateCase,
  findContact,
  findLead,
}
