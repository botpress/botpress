import z from 'zod'
import {
  addCustomerToCampaignInputSchema,
  addCustomerToListInputSchema,
  sendMassEmailCampaignInputSchema,
  addCustomerOutputSchema,
  sendMassEmailCampaignOutputSchema,
  getAllListsOutputSchema,
  getAllListsInputSchema,
} from '../misc/custom-schemas'

import {
  addCustomerToCampaignUi,
  addCustomerToListUi,
  sendMassEmailCampaignUi,
} from '../misc/custom-uis'

const addCustomerToCampaign = {
  title: 'Add Customer Profile to Campaign',
  description: 'Add Customer Profile to Campaign List',
  input: {
    schema: addCustomerToCampaignInputSchema,
    ui: addCustomerToCampaignUi,
  },
  output: {
    schema: addCustomerOutputSchema,
  },
}

const addCustomerToList = {
  title: 'Add Customer Profile to List/Audience',
  description: 'Add Customer Profile to List/Audience',
  input: {
    schema: addCustomerToListInputSchema,
    ui: addCustomerToListUi,
  },
  output: {
    schema: addCustomerOutputSchema,
  },
}

const sendMassEmailCampaign = {
  title: 'Mass Mailing of the Campaign',
  description: 'Mass Mailing of the Campaign by its IDs',
  input: {
    schema: sendMassEmailCampaignInputSchema,
    ui: sendMassEmailCampaignUi,
  },
  output: {
    schema: sendMassEmailCampaignOutputSchema,
  },
}

const getAllLists = {
  title: 'Get All Email Lists/Audiences',
  description: 'Get all available email lists/audiences',
  input: {
    schema: getAllListsInputSchema,
    ui: {
      count: {
        title: 'List count to retrieve',
      }
    }
  },
  output: {
    schema: getAllListsOutputSchema,
  },
}

export const actions = {
  getAllLists,
  addCustomerToCampaign,
  addCustomerToList,
  sendMassEmailCampaign,
}
