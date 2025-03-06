import { conversation, z } from '@botpress/sdk'

export const emptyInputSchema = z.object({});

export const makeApiCallInputSchema = z.object({
  endpoint: z.string().describe('The API endpoint to call'),
  method: z.string().describe("The HTTP method to use ['GET', 'POST', 'PUT', 'DELETE']"),
  data: z.string().optional().describe('The data to send with the request as a string JSON object.'),
  params: z.string().optional().describe('The params to send with the request as a string JSON object if required.')
})

export const makeApiCallOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any()
})

export const getRecordsInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module to retrieve records from (e.g., Leads, Contacts, Deals)'),
  params: z.string().optional().describe('Optional query parameters as a JSON string (e.g., pagination, sorting)')
});

export const getRecordsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('List of retrieved records'),
});

export const getRecordByIdInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module to retrieve the record from (e.g., Leads, Contacts, Deals)'),
  recordId: z.string().describe('The unique ID of the record to retrieve'),
});

export const getRecordByIdOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('The retrieved record data from Zoho CRM'),
});

export const insertRecordInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module to insert the records into (e.g., Leads, Contacts, Deals)'),
  data: z.string().describe('The raw JSON string containing the records to insert'),
});

export const insertRecordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Details of the inserted records'),
});

export const updateRecordInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module where the record exists'),
  recordId: z.string().describe('The unique ID of the record to update'),
  data: z.string().describe('The raw JSON string containing the updated data'),
});

export const updateRecordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Details of the updated record'),
});

export const deleteRecordInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module where the record exists'),
  recordId: z.string().describe('The unique ID of the record to delete'),
});

export const deleteRecordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Response from Zoho confirming the record deletion'),
});

export const searchRecordsInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module to search within'),
  criteria: z.string().describe('The search criteria using Zoho CRM query syntax'),
});

export const searchRecordsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('List of records matching the search criteria'),
});

export const getOrganizationDetailsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Details of the organization retrieved from Zoho CRM'),
});

export const getUsersInputSchema = z.object({
  params: z.string().optional().describe('Optional query parameters as a JSON string for filtering users (e.g., role, status)'),
});

export const getUsersOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('List of users retrieved from Zoho CRM'),
});

export const getAppointmentByIdInputSchema = z.object({
  appointmentId: z.string().describe('The unique ID of the appointment to retrieve'),
});

export const getAppointmentByIdOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('The retrieved appointment data from Zoho CRM'),
});

export const getAppointmentsInputSchema = z.object({
  params: z.string().optional().describe('Optional query parameters as a JSON string (e.g., date range, filters)'),
});

export const getAppointmentsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('List of retrieved appointments'),
});

export const createAppointmentInputSchema = z.object({
  data: z.string().describe('The raw JSON string containing the appointment details'),
});

export const createAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Details of the created appointment'),
});

export const updateAppointmentInputSchema = z.object({
  appointmentId: z.string().describe('The unique ID of the appointment to update'),
  data: z.string().describe('The raw JSON string containing the updated appointment details'),
});

export const updateAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Details of the updated appointment'),
});

export const deleteAppointmentInputSchema = z.object({
  appointmentId: z.string().describe('The unique ID of the appointment to delete'),
});

export const deleteAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Response from Zoho confirming the appointment deletion'),
});

export const sendMailInputSchema = z.object({
  module: z.string().describe('The Zoho CRM module to send mail to'),
  recordId: z.string().describe('The unique ID of the record to attach the file to'),
  data: z.string().describe('The raw JSON string containing email details including recipient, subject, and body'),
});

export const sendMailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('Response from Zoho after sending the email'),
});

export const uploadFileInputSchema = z.object({
  fileUrl: z.string().describe("The url of the file being uploaded."),
});

export const uploadFileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe("Details of the uploaded file, including its Zoho file ID."),
});

export const getFileInputSchema = z.object({
  fileId: z.string().describe('The encrypted ID of the file to retrieve'),
});

export const getFileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().describe('The retrieved file data from Zoho'),
});