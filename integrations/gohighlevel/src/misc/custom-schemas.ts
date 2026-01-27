import { z } from '@botpress/sdk'

/*
Action Schemas
*/

// Create Contact
export const createContactInputSchema = z.object({
  properties: z.string().describe('Properties of the contact to create, as a string JSON object.'),
})

export const createContactOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Get Contact
export const getContactInputSchema = z.object({
  contactId: z.string().describe('ID of the contact to retrieve'),
})

export const getContactOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Update Contact
export const updateContactInputSchema = z.object({
  contactId: z.string().describe('ID of the contact to update'),
  properties: z.string().describe('Properties of the contact to update, as a string JSON object.'),
})

export const updateContactOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Delete Contact
export const deleteContactInputSchema = z.object({
  contactId: z.string().describe('ID of the contact to delete'),
})

export const deleteContactOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// Upsert Contact
export const upsertContactInputSchema = z.object({
  properties: z.string().describe('Properties of the contact to upsert, as a string JSON object.'),
})

export const upsertContactOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Get Contacts By Business ID
export const getContactsByBusinessIdInputSchema = z.object({
  businessId: z.string().describe('ID of the business whose contacts are to be retrieved'),
  params: z.string().optional().describe('Optional query parameters as a string JSON object.'),
})

export const getContactsByBusinessIdOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

/*
Company Schemas
*/

// Get Company
export const getCompanyInputSchema = z.object({
  companyId: z.string().describe('ID of the company to retrieve'),
})

export const getCompanyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

/*
Opportunity Schemas
*/

// Get Opportunity
export const getOpportunityInputSchema = z.object({
  opportunityId: z.string().describe('ID of the opportunity to retrieve'),
})

export const getOpportunityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Create Opportunity
export const createOpportunityInputSchema = z.object({
  properties: z.string().describe('Properties of the opportunity to create, as a string JSON object.'),
})

export const createOpportunityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Update Opportunity
export const updateOpportunityInputSchema = z.object({
  opportunityId: z.string().describe('ID of the opportunity to update'),
  properties: z.string().describe('Properties of the opportunity to update, as a string JSON object.'),
})

export const updateOpportunityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Update Opportunity Status
export const updateOpportunityStatusInputSchema = z.object({
  opportunityId: z.string().describe('ID of the opportunity to update'),
  status: z.string().describe('New status of the opportunity'),
})

export const updateOpportunityStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Delete Opportunity
export const deleteOpportunityInputSchema = z.object({
  opportunityId: z.string().describe('ID of the opportunity to delete'),
})

export const deleteOpportunityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// Upsert Opportunity
export const upsertOpportunityInputSchema = z.object({
  properties: z.string().describe('Properties of the opportunity to upsert, as a string JSON object.'),
})

export const upsertOpportunityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

/*
Order Schemas
*/

// List Orders
export const listOrdersInputSchema = z.object({
  properties: z.string().describe('The order list params (e.g., location ID)'),
})

export const listOrdersOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Get Order By ID
export const getOrderByIdInputSchema = z.object({
  orderId: z.string().describe('The ID of the order to retrieve'),
  altId: z.string().describe('The ID related to the order (e.g., location ID)'),
  altType: z.string().describe('The type of the alternate ID (e.g., location)'),
})

export const getOrderByIdOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

/*
Calendar & Appointment Schemas
*/

// Get Calendar Events
export const getCalendarEventsInputSchema = z.object({
  properties: z.string().describe('The order list params (e.g., location ID, start time, end time)'),
})

export const getCalendarEventsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Get Appointment
export const getAppointmentInputSchema = z.object({
  appointmentId: z.string().describe('The ID of the appointment to retrieve'),
})

export const getAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Create Appointment
export const createAppointmentInputSchema = z.object({
  properties: z.string().describe('Properties of the appointment to create.'),
})

export const createAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Update Appointment
export const updateAppointmentInputSchema = z.object({
  appointmentId: z.string().describe('ID of the appointment to update'),
  properties: z.string().describe('Updated properties of the appointment, as a string JSON object.'),
})

export const updateAppointmentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})

// Delete Event
export const deleteEventInputSchema = z.object({
  eventId: z.string().describe('ID of the event to delete'),
})

export const deleteEventOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

/*
General API Call Schema
*/
export const makeApiCallInputSchema = z.object({
  endpoint: z.string().describe('The API endpoint to call'),
  method: z.string().describe("The HTTP method to use ['GET', 'POST', 'PUT', 'DELETE']"),
  data: z.string().optional().describe('The data to send with the request as a string JSON object.'),
  params: z.string().optional().describe('The params to send with the request as a string JSON object if required.'),
})

export const makeApiCallOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
})
