import { IntegrationDefinition, z } from '@botpress/sdk'

import {
  createContactInputSchema,
  createContactOutputSchema,
  updateContactInputSchema,
  updateContactOutputSchema,
  getContactInputSchema,
  getContactOutputSchema,
  deleteContactInputSchema,
  deleteContactOutputSchema,
  upsertContactInputSchema,
  upsertContactOutputSchema,
  createOpportunityInputSchema,
  createOpportunityOutputSchema,
  updateOpportunityInputSchema,
  updateOpportunityOutputSchema,
  updateOpportunityStatusInputSchema,
  updateOpportunityStatusOutputSchema,
  upsertOpportunityInputSchema,
  upsertOpportunityOutputSchema,
  getOpportunityInputSchema,
  getOpportunityOutputSchema,
  deleteOpportunityInputSchema,
  deleteOpportunityOutputSchema,
  listOrdersInputSchema,
  listOrdersOutputSchema,
  getOrderByIdInputSchema,
  getOrderByIdOutputSchema,
  getCalendarEventsInputSchema,
  getCalendarEventsOutputSchema,
  getAppointmentInputSchema,
  getAppointmentOutputSchema,
  updateAppointmentInputSchema,
  updateAppointmentOutputSchema,
  createAppointmentInputSchema,
  createAppointmentOutputSchema,
  deleteEventInputSchema,
  deleteEventOutputSchema,
  getContactsByBusinessIdInputSchema,
  getContactsByBusinessIdOutputSchema,
  makeApiCallInputSchema,
  makeApiCallOutputSchema,
} from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'plus/go-high-level',
  version: '1.0.4',
  title: 'GoHighLevel',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Integrate your Botpress chatbot with GoHighLevel CRM to manage customer interactions. Add, update, and retrieve contacts, opportunities, orders, and appointments directly through your chatbot.',
  configuration: {
    schema: z.object({
      clientId: z.string().describe('Your GoHighLevel Client ID'),
      clientSecret: z.string().describe('Your GoHighLevel Client Secret'),
      accessToken: z.string().describe('Your GoHighLevel API key'),
      refreshToken: z.string().describe('Your GoHighLevel API key'),
    }),
  },
  events: {},
  user: {
    tags: {
      id: {
        title: 'GoHighLevel tokens',
      },
    },
  },
  channels: {},
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
        refreshToken: z.string(),
      }),
    },
  },
  actions: {
    createContact: {
      title: 'Create Contact',
      input: { schema: createContactInputSchema },
      output: { schema: createContactOutputSchema },
    },
    updateContact: {
      title: 'Update Contact',
      input: { schema: updateContactInputSchema },
      output: { schema: updateContactOutputSchema },
    },
    getContact: {
      title: 'Get Contact',
      input: { schema: getContactInputSchema },
      output: { schema: getContactOutputSchema },
    },
    deleteContact: {
      title: 'Delete Contact',
      input: { schema: deleteContactInputSchema },
      output: { schema: deleteContactOutputSchema },
    },
    upsertContact: {
      title: 'Upsert Contact',
      input: { schema: upsertContactInputSchema },
      output: { schema: upsertContactOutputSchema },
    },
    getContactsByBusinessId: {
      title: 'Get Contacts By Business Id',
      input: { schema: getContactsByBusinessIdInputSchema },
      output: { schema: getContactsByBusinessIdOutputSchema },
    },
    createOpportunity: {
      title: 'Create Opportunity',
      input: { schema: createOpportunityInputSchema },
      output: { schema: createOpportunityOutputSchema },
    },
    updateOpportunity: {
      title: 'Update Opportunity',
      input: { schema: updateOpportunityInputSchema },
      output: { schema: updateOpportunityOutputSchema },
    },
    updateOpportunityStatus: {
      title: 'Update Opportunity Status',
      input: { schema: updateOpportunityStatusInputSchema },
      output: { schema: updateOpportunityStatusOutputSchema },
    },
    upsertOpportunity: {
      title: 'Upsert Opportunity',
      input: { schema: upsertOpportunityInputSchema },
      output: { schema: upsertOpportunityOutputSchema },
    },
    getOpportunity: {
      title: 'Get Opportunity',
      input: { schema: getOpportunityInputSchema },
      output: { schema: getOpportunityOutputSchema },
    },
    deleteOpportunity: {
      title: 'Delete Opportunity',
      input: { schema: deleteOpportunityInputSchema },
      output: { schema: deleteOpportunityOutputSchema },
    },
    listOrders: {
      title: 'List Orders',
      input: { schema: listOrdersInputSchema },
      output: { schema: listOrdersOutputSchema },
    },
    getOrderById: {
      title: 'Get Order By ID',
      input: { schema: getOrderByIdInputSchema },
      output: { schema: getOrderByIdOutputSchema },
    },
    getCalendarEvents: {
      title: 'Get Calendar Events',
      input: { schema: getCalendarEventsInputSchema },
      output: { schema: getCalendarEventsOutputSchema },
    },
    getAppointment: {
      title: 'Get Appointment',
      input: { schema: getAppointmentInputSchema },
      output: { schema: getAppointmentOutputSchema },
    },
    updateAppointment: {
      title: 'Update Appointment',
      input: { schema: updateAppointmentInputSchema },
      output: { schema: updateAppointmentOutputSchema },
    },
    createAppointment: {
      title: 'Create Appointment',
      input: { schema: createAppointmentInputSchema },
      output: { schema: createAppointmentOutputSchema },
    },
    deleteEvent: {
      title: 'Delete Event',
      input: { schema: deleteEventInputSchema },
      output: { schema: deleteEventOutputSchema },
    },
    makeApiCall: {
      title: 'Make API Call',
      input: { schema: makeApiCallInputSchema },
      output: { schema: makeApiCallOutputSchema },
    },
  },
})
