import {
  createCaseInputSchema,
  createCaseOutputSchema,
  createContactInputSchema,
  createContactOutputSchema,
  createLeadInputSchema,
  createLeadOutputSchema,
  updateCaseInputSchema,
  updateCaseOutputSchema,
  updateContactInputSchema,
  updateContactOutputSchema,
  updateLeadInputSchema,
  updateLeadOutputSchema,
  findContactInputSchema,
  findContactOutputSchema,
  findLeadInputSchema,
  findLeadOutputSchema,
  findCaseInputSchema,
  findCaseOutputSchema,
} from '../misc/custom-schemas'

import {
  createCaseUi,
  createContactUi,
  createLeadUi,
  updateCaseUi,
  updateContactUi,
  updateLeadUi,
  findContactUi,
  findLeadUi,
  findCaseUi,
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

const updateContact = {
  title: 'Update Contact',
  input: {
    schema: updateContactInputSchema,
    ui: updateContactUi,
  },
  output: {
    schema: updateContactOutputSchema,
  },
}

const updateLead = {
  title: 'Update Lead',
  input: {
    schema: updateLeadInputSchema,
    ui: updateLeadUi,
  },
  output: {
    schema: updateLeadOutputSchema,
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

const findCase = {
  title: 'Find Case',
  input: {
    schema: findCaseInputSchema,
    ui: findCaseUi,
  },
  output: {
    schema: findCaseOutputSchema,
  },
}

export const actions = {
  createCase,
  createContact,
  createLead,
  updateCase,
  updateContact,
  updateLead,
  findContact,
  findLead,
  findCase,
}
