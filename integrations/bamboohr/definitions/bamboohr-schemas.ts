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
  privateKey: z.string().title('Private Key').describe('The private key to validate incoming webhooks.'),
})

/** Fields that can be monitored for updates as a webhook event */
export const bambooHrEmployeeWebhookFields = z
  .object({
    customBenefitIDNumber: z
      .string()
      .nullable()
      .optional()
      .title('Custom Benefit ID Number')
      .describe('Custom benefit ID number.'),
    customCitizenshipCertificate: z
      .string()
      .nullable()
      .optional()
      .title('Custom Citizenship Certificate')
      .describe('Custom citizenship certificate.'),
    payChangeReason: z.string().nullable().optional().title('Pay Change Reason').describe('Pay change reason.'),
    payRateEffectiveDate: z
      .string()
      .nullable()
      .optional()
      .title('Pay Rate Effective Date')
      .describe('Pay rate effective date.'),
    department: z.string().nullable().optional().title('Department').describe('Department.'),
    division: z.string().nullable().optional().title('Division').describe('Division.'),
    employeeNumber: z.string().nullable().optional().title('Employee Number').describe('Employee number.'),
    employeeTaxType: z.string().nullable().optional().title('Employee Tax Type').describe('Employee tax type.'),
    employmentHistoryStatus: z
      .string()
      .nullable()
      .optional()
      .title('Employment History Status')
      .describe('Employment history status.'),
    employeeStatusDate: z
      .string()
      .nullable()
      .optional()
      .title('Employee Status Date')
      .describe('Employee status date.'),
    ethnicity: z.string().nullable().optional().title('Ethnicity').describe('Ethnicity.'),
    facebook: z.string().nullable().optional().title('Facebook').describe('Facebook.'),
    firstName: z.string().nullable().optional().title('First Name').describe('First name.'),
    gender: z.string().nullable().optional().title('Gender').describe('Gender.'),
    hireDate: z.string().nullable().optional().title('Hire Date').describe('Hire date.'),
    homeEmail: z.string().nullable().optional().title('Home Email').describe('Home email.'),
    homePhone: z.string().nullable().optional().title('Home Phone').describe('Home phone.'),
    jobTitle: z.string().nullable().optional().title('Job Title').describe('Job title.'),
    lastName: z.string().nullable().optional().title('Last Name').describe('Last name.'),
    linkedIn: z.string().nullable().optional().title('LinkedIn').describe('LinkedIn.'),
    location: z.string().nullable().optional().title('Location').describe('Location.'),
    maritalStatus: z.string().nullable().optional().title('Marital Status').describe('Marital status.'),
    middleName: z.string().nullable().optional().title('Middle Name').describe('Middle name.'),
    mobilePhone: z.string().nullable().optional().title('Mobile Phone').describe('Mobile phone.'),
    customNIN1: z.string().nullable().optional().title('Custom NIN1').describe('Custom NIN1.'),
    nationality: z.string().nullable().optional().title('Nationality').describe('Nationality.'),
    originalHireDate: z.string().nullable().optional().title('Original Hire Date').describe('Original hire date.'),
    overtimeRate: z.string().nullable().optional().title('Overtime Rate').describe('Overtime rate.'),
    exempt: z.string().nullable().optional().title('Exempt').describe('Exempt.'),
    payPer: z.string().nullable().optional().title('Pay Per').describe('Pay per.'),
    paySchedule: z.string().nullable().optional().title('Pay Schedule').describe('Pay schedule.'),
    payRate: z.string().nullable().optional().title('Pay Rate').describe('Pay rate.'),
    payType: z.string().nullable().optional().title('Pay Type').describe('Pay type.'),
    preferredName: z.string().nullable().optional().title('Preferred Name').describe('Preferred name.'),
    customProbationaryPeriodEndDate: z
      .string()
      .nullable()
      .optional()
      .title('Custom Probationary Period End Date')
      .describe('Custom probationary period end date.'),
    customProbationaryPeriodStartDate: z
      .string()
      .nullable()
      .optional()
      .title('Custom Probationary Period Start Date')
      .describe('Custom probationary period start date.'),
    customProjectedTerminationDate: z
      .string()
      .nullable()
      .optional()
      .title('Custom Projected Termination Date')
      .describe('Custom projected termination date.'),
    customROESATCompleted: z
      .string()
      .nullable()
      .optional()
      .title('Custom ROESAT Completed')
      .describe('Custom ROESAT completed.'),
    reportsTo: z.string().nullable().optional().title('Reports To').describe('Reports to.'),
    customShirtsize: z.string().nullable().optional().title('Custom Shirt Size').describe('Custom shirt size.'),
    status: z.string().nullable().optional().title('Status').describe('Status.'),
    teams: z.string().nullable().optional().title('Teams').describe('Teams.'),
    customTerminationCode: z
      .string()
      .nullable()
      .optional()
      .title('Custom Termination Code')
      .describe('Custom termination code.'),
    customTerminationNoticeGiven: z
      .string()
      .nullable()
      .optional()
      .title('Custom Termination Notice Given')
      .describe('Custom termination notice given.'),
    twitterFeed: z.string().nullable().optional().title('Twitter Feed').describe('Twitter feed.'),
    workEmail: z.string().nullable().optional().title('Work Email').describe('Work email.'),
    workPhoneExtension: z
      .string()
      .nullable()
      .optional()
      .title('Work Phone Extension')
      .describe('Work phone extension.'),
    workPhone: z.string().nullable().optional().title('Work Phone').describe('Work phone.'),
  })
  .passthrough()

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
