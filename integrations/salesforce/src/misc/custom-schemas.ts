import z from 'zod'

import { ErrorSchema } from './sub-schemas'

export const createCaseInputSchema = z.object({
  subject: z.string().describe('The subject of the case (e.g. My Subject)'),
  suppliedName: z
    .string()
    .describe('The supplied name for the case (e.g. ExampleName)'),
  description: z.string().optional().describe('The description of the case'),
  priority: z
    .string()
    .optional()
    .describe('The priority of the case (e.g. Medium)'),
  botId: z.string().optional().describe('The bot ID (e.g. user-1)'),
})

export const createCaseOutputSchema = z
  .object({
    id: z.string().optional(),
    success: z.boolean().optional(),
    errors: z.array(ErrorSchema).optional(),
  })
  .partial()

export const findContactInputSchema = z.object({
  email: z.string().describe('Contact email (e.g. example@example.com)'),
})

export const findContactOutputSchema = z
  .object({
    id: z.string(),
    url: z.string().optional(),
  })
  .partial()

export const findLeadInputSchema = z.object({
  email: z.string().describe('Contact email (e.g. example@example.com)'),
})

export const findLeadOutputSchema = findContactOutputSchema

export const createContactInputSchema = z.object({
  firstName: z.string().describe('The last name of the contact (e.g. John)'),
  lastName: z.string().describe('The last name of the contact (e.g. Doe)'),
  accountId: z
    .string()
    .describe('The ID of the account associated with the contact'),
  email: z
    .string()
    .describe('The email address of the contact (e.g. john.doe@example.com)'),
  phone: z
    .string()
    .optional()
    .describe('The phone number of the contact (Optional) (e.g. +1-555-1234)'),
})

export const createContactOutputSchema = createCaseOutputSchema

export const createLeadInputSchema = z.object({
  firstName: z.string().describe('The last name of the contact (e.g. John)'),
  lastName: z.string().describe('The last name of the lead (e.g. Doe)'),
  company: z.string().describe('The company of the lead (e.g. Acme Inc.)'),
  email: z
    .string()
    .describe('The email address of the lead (e.g. john.doe@example.com)'),
  phone: z
    .string()
    .optional()
    .describe('The phone number of the lead (Optional) (e.g. +1-555-1234)'),
})

export const createLeadOutputSchema = createCaseOutputSchema

export const updateCaseInputSchema = z.object({
  caseId: z.string().describe('The ID of the case to update'),
  subject: z
    .string()
    .optional()
    .describe(
      'The updated subject of the case (Optional) (e.g. My Updated Subject)'
    ),
  suppliedName: z
    .string()
    .optional()
    .describe(
      'The updated supplied name for the case (Optional) (e.g. UpdatedExampleName)'
    ),
  description: z
    .string()
    .optional()
    .describe('The updated description of the case (Optional)'),
  priority: z
    .string()
    .optional()
    .describe('The updated priority of the case (Optional) (e.g. High)'),
  origin: z
    .string()
    .optional()
    .describe(
      'The updated origin of the case (Optional) (e.g. Botpress: bot user-1)'
    ),
})

export const updateCaseOutputSchema = createCaseOutputSchema
