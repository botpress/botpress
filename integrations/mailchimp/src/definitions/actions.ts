import {
  addCustomerToCampaignInputSchema,
  addCustomerToListInputSchema,
  sendMassEmailCampaignInputSchema,
  addCustomerOutputSchema,
  sendMassEmailCampaignOutputSchema,
  getAllListsOutputSchema,
  getAllListsInputSchema,
  getAllCampaignsOutputSchema,
  getAllCampaignsInputSchema,
} from '../misc/custom-schemas'
import { addCustomerToCampaignUi, addCustomerToListUi, sendMassEmailCampaignUi } from '../misc/custom-uis'

const addCustomerToCampaign = {
  title: 'Add Customer Profile to Campaign',
  description: "Adds a Customer's Profile to a Campaign",
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
  description: "Add Customer's Profile to a List/Audience",
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
      },
    },
  },
  output: {
    schema: getAllListsOutputSchema,
  },
}

export const getAllCampaigns = {
  title: 'Get All Campaigns',
  description: 'Get all available campaigns',
  input: {
    schema: getAllCampaignsInputSchema,
    ui: {
      count: {
        title: 'List count to retrieve',
      },
    },
  },
  output: {
    schema: getAllCampaignsOutputSchema,
  },
}

export const actions = {
  getAllLists,
  getAllCampaigns,
  addCustomerToCampaign,
  addCustomerToList,
  sendMassEmailCampaign,
}
