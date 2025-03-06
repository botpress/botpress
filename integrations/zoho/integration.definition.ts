import { IntegrationDefinition, z } from '@botpress/sdk';
import { integrationName } from './package.json';

import {
  makeApiCallInputSchema, makeApiCallOutputSchema,
  getRecordByIdInputSchema, getRecordByIdOutputSchema,
  insertRecordInputSchema, insertRecordOutputSchema,
  updateRecordInputSchema, updateRecordOutputSchema,
  deleteRecordInputSchema, deleteRecordOutputSchema,
  searchRecordsInputSchema, searchRecordsOutputSchema,
  getRecordsInputSchema, getRecordsOutputSchema,
  getOrganizationDetailsOutputSchema,
  getUsersInputSchema, getUsersOutputSchema,
  emptyInputSchema,
  getAppointmentsInputSchema, getAppointmentsOutputSchema,
  getAppointmentByIdInputSchema, getAppointmentByIdOutputSchema,
  createAppointmentInputSchema, createAppointmentOutputSchema,
  updateAppointmentInputSchema, updateAppointmentOutputSchema,
  deleteAppointmentInputSchema, deleteAppointmentOutputSchema,
  sendMailInputSchema, sendMailOutputSchema,
  uploadFileInputSchema, uploadFileOutputSchema,
  getFileInputSchema, getFileOutputSchema,
} from './src/misc/custom-schemas';

export default new IntegrationDefinition({
  name: integrationName ?? 'zoho',
  version: '3.0.0',
  title: 'Zoho',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Integrate your Botpress chatbot with Zoho CRM to manage customer interactions. Add, update, and retrieve contacts, deals, orders, and appointments directly through your chatbot.',
  configuration: {
    schema: z.object({
      clientId: z.string().describe('Your Zoho Client ID'),
      clientSecret: z.string().describe('Your Zoho Client Secret'),
      accessToken: z.string().describe('Your Zoho Access Token'),
      refreshToken: z.string().describe('Your Zoho Refresh Token'),
      dataCenter: z.enum(['us', 'eu', 'in', 'au', 'cn', 'jp', 'ca']).describe('Zoho Data Center Region'),
    }),
  },
  events: {},
  user: {
    tags: {
      id: {
        title: 'Zoho Tokens',
      },
    },
  },
  channels: {},
  states: {
    credentials: {
      type: "integration",
      schema: z.object({
        accessToken: z.string(),
      }),
    },
  },
  actions: {
    makeApiCall: {
      title: 'Make API Call',
      input: { schema: makeApiCallInputSchema },
      output: { schema: makeApiCallOutputSchema },
    },
    insertRecord: {
      title: 'Insert Record',
      input: { schema: insertRecordInputSchema },
      output: { schema: insertRecordOutputSchema },
    },
    updateRecord: {
      title: 'Update Record',
      input: { schema: updateRecordInputSchema },
      output: { schema: updateRecordOutputSchema },
    },
    deleteRecord: {
      title: 'Delete Record',
      input: { schema: deleteRecordInputSchema },
      output: { schema: deleteRecordOutputSchema },
    },
    searchRecords: {
      title: 'Search Records',
      input: { schema: searchRecordsInputSchema },
      output: { schema: searchRecordsOutputSchema },
    },
    getRecordById: {
      title: 'Get Record By ID',
      input: { schema: getRecordByIdInputSchema },
      output: { schema: getRecordByIdOutputSchema },
    },
    getRecords: { 
      title: 'Get Records',
      input: { schema: getRecordsInputSchema },
      output: { schema: getRecordsOutputSchema },
    },
    getOrganizationDetails: {
      title: 'Get Organization Details',
      input: { schema: emptyInputSchema },
      output: { schema: getOrganizationDetailsOutputSchema },
    },
    getUsers: {
      title: 'Get Users',
      input: { schema: getUsersInputSchema },
      output: { schema: getUsersOutputSchema },
    },
    getAppointments: {
      title: 'Get Appointments',
      input: { schema: getAppointmentsInputSchema },
      output: { schema: getAppointmentsOutputSchema },
    },
    getAppointmentById: {
      title: 'Get Appointment By ID',
      input: { schema: getAppointmentByIdInputSchema },
      output: { schema: getAppointmentByIdOutputSchema },
    },
    createAppointment: {
      title: 'Create Appointment',
      input: { schema: createAppointmentInputSchema },
      output: { schema: createAppointmentOutputSchema },
    },
    updateAppointment: {
      title: 'Update Appointment',
      input: { schema: updateAppointmentInputSchema },
      output: { schema: updateAppointmentOutputSchema },
    },
    deleteAppointment: {
      title: 'Delete Appointment',
      input: { schema: deleteAppointmentInputSchema },
      output: { schema: deleteAppointmentOutputSchema },
    },
    sendMail: {
      title: 'Send Mail',
      input: { schema: sendMailInputSchema },
      output: { schema: sendMailOutputSchema },
    },
    uploadFile: {
      title: 'Upload File',
      input: { schema: uploadFileInputSchema },
      output: { schema: uploadFileOutputSchema },
    },
    getFile: {
      title: 'Get File',
      input: { schema: getFileInputSchema },
      output: { schema: getFileOutputSchema },
    },
  },
});
