import { IntegrationDefinition, z } from '@botpress/sdk'

import {
  makeApiCallInputSchema,
  makeApiCallOutputSchema,
  getRecordByIdInputSchema,
  getRecordByIdOutputSchema,
  insertRecordInputSchema,
  insertRecordOutputSchema,
  updateRecordInputSchema,
  updateRecordOutputSchema,
  deleteRecordInputSchema,
  deleteRecordOutputSchema,
  searchRecordsInputSchema,
  searchRecordsOutputSchema,
  getRecordsInputSchema,
  getRecordsOutputSchema,
  getOrganizationDetailsOutputSchema,
  getUsersInputSchema,
  getUsersOutputSchema,
  emptyInputSchema,
  getAppointmentsInputSchema,
  getAppointmentsOutputSchema,
  getAppointmentByIdInputSchema,
  getAppointmentByIdOutputSchema,
  createAppointmentInputSchema,
  createAppointmentOutputSchema,
  updateAppointmentInputSchema,
  updateAppointmentOutputSchema,
  deleteAppointmentInputSchema,
  deleteAppointmentOutputSchema,
  sendMailInputSchema,
  sendMailOutputSchema,
  uploadFileInputSchema,
  uploadFileOutputSchema,
  getFileInputSchema,
  getFileOutputSchema,
} from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'zoho',
  version: '3.0.0',
  title: 'Zoho',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Integrate your Botpress chatbot with Zoho CRM to manage customer interactions. Add, update, and retrieve contacts, deals, orders, and appointments directly through your chatbot.',
  configuration: {
    schema: z.object({
      clientId: z.string().title('Client ID').describe('Your Zoho Client ID'),
      clientSecret: z.string().title('Client Secret').describe('Your Zoho Client Secret'),
      refreshToken: z.string().title('Refresh Token').describe('Your Zoho Refresh Token'),
      dataCenter: z
        .enum(['us', 'eu', 'in', 'au', 'cn', 'jp', 'ca'])
        .title('Data Center Region')
        .describe('Zoho Data Center Region'),
    }),
  },
  user: {
    tags: {
      id: {
        title: 'Zoho Tokens',
        description: 'Zoho CRM access and refresh tokens',
      },
    },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().title('Access Token').describe('Your Zoho Access Token'),
      }),
    },
  },
  actions: {
    makeApiCall: {
      title: 'Make API Call',
      description: 'Make a custom API call to the Zoho CRM API',
      input: { schema: makeApiCallInputSchema },
      output: { schema: makeApiCallOutputSchema },
    },
    insertRecord: {
      title: 'Insert Record',
      description: 'Insert a new record into a Zoho CRM module',
      input: { schema: insertRecordInputSchema },
      output: { schema: insertRecordOutputSchema },
    },
    updateRecord: {
      title: 'Update Record',
      description: 'Update an existing record in a Zoho CRM module',
      input: { schema: updateRecordInputSchema },
      output: { schema: updateRecordOutputSchema },
    },
    deleteRecord: {
      title: 'Delete Record',
      description: 'Delete a record from a Zoho CRM module',
      input: { schema: deleteRecordInputSchema },
      output: { schema: deleteRecordOutputSchema },
    },
    searchRecords: {
      title: 'Search Records',
      description: 'Search for records in a Zoho CRM module',
      input: { schema: searchRecordsInputSchema },
      output: { schema: searchRecordsOutputSchema },
    },
    getRecordById: {
      title: 'Get Record By ID',
      description: 'Retrieve a record from a Zoho CRM module by its unique ID',
      input: { schema: getRecordByIdInputSchema },
      output: { schema: getRecordByIdOutputSchema },
    },
    getRecords: {
      title: 'Get Records',
      description: 'Retrieve records from a Zoho CRM module',
      input: { schema: getRecordsInputSchema },
      output: { schema: getRecordsOutputSchema },
    },
    getOrganizationDetails: {
      title: 'Get Organization Details',
      description: 'Retrieve details about the Zoho CRM organization',
      input: { schema: emptyInputSchema },
      output: { schema: getOrganizationDetailsOutputSchema },
    },
    getUsers: {
      title: 'Get Users',
      description: 'Retrieve a list of users from the Zoho CRM organization',
      input: { schema: getUsersInputSchema },
      output: { schema: getUsersOutputSchema },
    },
    getAppointments: {
      title: 'Get Appointments',
      description: 'Retrieve a list of appointments from the Zoho CRM organization',
      input: { schema: getAppointmentsInputSchema },
      output: { schema: getAppointmentsOutputSchema },
    },
    getAppointmentById: {
      title: 'Get Appointment By ID',
      description: 'Retrieve an appointment from the Zoho CRM organization by its unique ID',
      input: { schema: getAppointmentByIdInputSchema },
      output: { schema: getAppointmentByIdOutputSchema },
    },
    createAppointment: {
      title: 'Create Appointment',
      description: 'Create a new appointment in the Zoho CRM organization',
      input: { schema: createAppointmentInputSchema },
      output: { schema: createAppointmentOutputSchema },
    },
    updateAppointment: {
      title: 'Update Appointment',
      description: 'Update an existing appointment in the Zoho CRM organization',
      input: { schema: updateAppointmentInputSchema },
      output: { schema: updateAppointmentOutputSchema },
    },
    deleteAppointment: {
      title: 'Delete Appointment',
      description: 'Delete an appointment from the Zoho CRM organization',
      input: { schema: deleteAppointmentInputSchema },
      output: { schema: deleteAppointmentOutputSchema },
    },
    sendMail: {
      title: 'Send Mail',
      description: 'Send an email using the Zoho CRM Mail API',
      input: { schema: sendMailInputSchema },
      output: { schema: sendMailOutputSchema },
    },
    uploadFile: {
      title: 'Upload File',
      description: 'Upload a file to the Zoho CRM organization',
      input: { schema: uploadFileInputSchema },
      output: { schema: uploadFileOutputSchema },
    },
    getFile: {
      title: 'Get File',
      description: 'Retrieve a file from the Zoho CRM organization by its unique ID',
      input: { schema: getFileInputSchema },
      output: { schema: getFileOutputSchema },
    },
  },
})
