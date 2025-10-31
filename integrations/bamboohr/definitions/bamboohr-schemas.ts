import { z } from '@botpress/sdk'
import mapValues from 'lodash/mapValues'
import { employeeId, timestamp } from './common'

export const bambooHrOauthTokenResponse = z.object({
  access_token: z.string().title('Access Token').describe('The temporary access token issued by BambooHR.'),
  refresh_token: z.string().title('Refresh Token').describe('The refresh token issued by BambooHR.'),
  expires_in: z.number().title('Expires In').describe('The number of seconds until the access token expires.'),
  token_type: z.literal('Bearer').title('Token Type').describe('The type of token issued.'),
  scope: z.string().title('Scopes').describe('The scopes granted to the access token (space-separated).'),
  id_token: z.string().title('ID Token').describe('A unique identifier for the user.'),
  companyDomain: z.string().title('Company Domain').describe('The company subdomain on BambooHR.'),
})

export const bambooHrWebhookCreateResponse = z.object({
  id: z.string().title('Webhook ID').describe('The unique identifier for the created webhook.'),
  created: z.string().title('Created At').describe('The timestamp at which the webhook was created.'),
  privateKey: z.string().title('Private Key').describe('The private key to validate incoming webhooks.'),
})

/** Fields that can be monitored for updates as a webhook event */
export const bambooHrEmployeeWebhookFields = z.object({
  firstName: z.string().title('First Name').describe("Employee's first name."),
  lastName: z.string().title('Last Name').describe("Employee's last name."),
  preferredName: z.string().nullable().optional().title('Preferred Name').describe("Employee's preferred name."),
  jobTitle: z.string().nullable().optional().title('Job Title').describe("Employee's job title."),
  department: z.string().nullable().optional().title('Department').describe("Employee's department."),
  division: z.string().nullable().optional().title('Division').describe("Employee's division."),
  location: z.string().nullable().optional().title('Location').describe("Employee's work location."),
  mobilePhone: z.string().nullable().optional().title('Mobile Phone').describe("Employee's mobile phone number."),
  workPhone: z.string().nullable().optional().title('Work Phone').describe("Employee's work phone number."),
  workPhoneExtension: z
    .string()
    .nullable()
    .optional()
    .title('Work Phone Extension')
    .describe("Employee's work phone extension."),
  homePhone: z.string().nullable().optional().title('Home Phone').describe("Employee's home phone number."),
  workEmail: z.string().nullable().optional().title('Work Email').describe("Employee's work email address."),
  homeEmail: z.string().nullable().optional().title('Home Email').describe("Employee's home email address."),
  hireDate: z.string().nullable().optional().title('Hire Date').describe("Employee's hire date (YYYY-MM-DD)."),
  terminationDate: z
    .string()
    .nullable()
    .optional()
    .title('Termination Date')
    .describe("Employee's termination date (YYYY-MM-DD)."),
  status: z.literal('Active').or(z.literal('Inactive')).title('Status').describe("Employee's status."),
})

const bambooHrEmployeeBaseEvent = z.object({
  id: employeeId,
  timestamp,
})
export const bambooHrEmployeeCreatedEvent = bambooHrEmployeeBaseEvent.extend({
  action: z.literal('Created').title('Action').describe('Creation action.'),
})
export const bambooHrEmployeeDeletedEvent = bambooHrEmployeeBaseEvent.extend({
  action: z.literal('Deleted').title('Action').describe('Deletion action.'),
})
export const bambooHrEmployeeUpdatedEvent = bambooHrEmployeeBaseEvent.extend({
  action: z.literal('Updated').title('Action').describe('Update action.'),
  fields: z
    .object(mapValues(bambooHrEmployeeWebhookFields.shape, (schema) => z.object({ value: schema })))
    .title('Fields')
    .describe(
      'All fields subscribed to for the employee, including unchanged fields. Value is nested as `fieldName: { value }`.'
    ),
  changedFields: z
    .array(z.string())
    .title('Changed Fields')
    .describe('List of fields that were changed in this event.'),
})

/**Employee events by BambooHR webhook */
export const bambooHrEmployeeWebhookEvent = z.object({
  employees: z
    .array(z.union([bambooHrEmployeeCreatedEvent, bambooHrEmployeeDeletedEvent, bambooHrEmployeeUpdatedEvent]))
    .title('Employees')
    .describe('List of employees included in the event.'),
})

/** All fields that can be queried on an employee as an action */
export const bambooHrEmployeeBasicInfoResponse = bambooHrEmployeeWebhookFields.extend({
  id: employeeId,
  supervisorEid: z.string().nullable().optional().title('Supervisor ID').describe("Employee's supervisor's ID."),
  lastChanged: z.string().title('Last Changed').describe('Full timestamp of the last change to the employee record.'),
  displayName: z.string().title('Display Name').describe("Employee's display name."),
})

export const bambooHrEmployeeCustomInfoResponse = z.object({ id: employeeId }).catchall(z.string())

export const bambooHrEmployeeDirectoryResponse = z.object({
  fields: z
    .array(
      z.object({
        id: z.string().title('Field ID').describe('Unique identifier for the field.'),
        name: z.string().title('Field Name').describe('Name of the field.'),
        type: z.string().title('Field Type').describe('Type of the field. See BambooHR API documentation for details.'),
      })
    )
    .title('Fields')
    .describe('List of fields included in the directory. Does not include all workspace fields.'),
  employees: z
    .array(
      z.object({
        id: employeeId,
        displayName: z.string().title('Display Name').describe("Employee's display name."),
      })
    )
    .title('Employees')
    .describe('List of employees in the directory. Includes more fields.'),
})

export const bambooHrCompanyInfo = z.object({
  legalName: z.string().title('Legal Name').describe('Legal name of the company.'),
  displayName: z.string().title('Display Name').describe('Display name of the company.'),
  address: z
    .object({
      line1: z.string().nullable().optional().title('Address Line 1').describe('First line of the street.'),
      line2: z.string().nullable().optional().title('Address Line 2').describe('Second line of the street.'),
      city: z.string().nullable().optional().title('City').describe('City.'),
      state: z.string().nullable().optional().title('State').describe('State or province.'),
      country: z.string().nullable().optional().title('Country').describe('Country.'),
      zip: z.string().nullable().optional().title('ZIP Code').describe('ZIP code.'),
    })
    .title('Address')
    .describe('Address of the company.'),
  phone: z.string().nullable().optional().title('Phone Number').describe('Phone number of the company.'),
})
