import { z } from '@botpress/sdk'
import { employeeId } from './common'

export const bambooHrOauthTokenResponse = z.object({
  access_token: z.string().title('Access Token').describe('The temporary access token issued by BambooHR.'),
  refresh_token: z.string().title('Refresh Token').describe('The refresh token issued by BambooHR.'),
  expires_in: z.number().title('Expires In').describe('The number of seconds until the access token expires.'),
  token_type: z.literal('Bearer').title('Token Type').describe('The type of token issued.'),
  scope: z.string().title('Scopes').describe('The scopes granted to the access token (space-separated).'),
  id_token: z.string().title('ID Token').describe('A unique identifier for the user.'),
  companyDomain: z.string().title('Company Domain').describe('The company subdomain on BambooHR.'),
})

export const bambooHrEmployeeBasicInfoResponse = z.object({
  id: employeeId,
  supervisorEid: z.string().nullable().optional().title('Supervisor ID').describe("Employee's supervisor's ID."),
  lastChanged: z.string().title('Last Changed').describe('Timestamp of the last change to the employee record.'),
  firstName: z.string().title('First Name').describe("Employee's first name."),
  lastName: z.string().title('Last Name').describe("Employee's last name."),
  displayName: z.string().title('Display Name').describe("Employee's display name."),
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
  email: z.string().nullable().optional().title('Email').describe("Employee's email address."),
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

export const bambooHrEmployeeSensitiveInfoResponse = z.object({
  id: employeeId,
  dateOfBirth: z
    .string()
    .nullable()
    .optional()
    .title('Date of Birth')
    .describe("Employee's date of birth (YYYY-MM-DD)."),
  sin: z
    .string()
    .nullable()
    .optional()
    .title('Social Insurance Number')
    .describe("Employee's Canadian Social Insurance Number."),
  ssn: z
    .string()
    .nullable()
    .optional()
    .title('Social Security Number')
    .describe("Employee's US Social Security Number."),
  nin: z
    .string()
    .nullable()
    .optional()
    .title('National Insurance Number')
    .describe("Employee's UK National Insurance Number."),
  address1: z.string().nullable().optional().title('Address Line 1').describe("Employee's address line 1."),
  address2: z.string().nullable().optional().title('Address Line 2').describe("Employee's address line 2."),
  city: z.string().nullable().optional().title('City').describe("Employee's city of residence."),
  state: z.string().nullable().optional().title('State').describe("Employee's state of residence."),
  country: z.string().nullable().optional().title('Country').describe("Employee's country of residence."),
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
