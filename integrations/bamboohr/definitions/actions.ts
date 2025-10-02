import { z, type ActionDefinition } from '@botpress/sdk'
import {
  bambooHrCompanyInfo,
  bambooHrEmployeeBasicInfoResponse,
  bambooHrEmployeeCustomInfoResponse,
  bambooHrEmployeeSensitiveInfoResponse,
} from './bamboohr-schemas'
import { employeeId, employeeIdObject } from './common'

const getEmployeeBasicInfo: ActionDefinition = {
  title: 'Get Employee Basic Info',
  description: 'Retrieve basic information about an employee by their ID.',
  input: {
    schema: employeeIdObject,
  },
  output: {
    schema: bambooHrEmployeeBasicInfoResponse,
  },
}

const getEmployeeSensitiveInfo: ActionDefinition = {
  title: 'Get Employee Sensitive Info',
  description: 'Retrieve sensitive information about an employee by their ID.',
  input: {
    schema: employeeIdObject,
  },
  output: {
    schema: bambooHrEmployeeSensitiveInfoResponse,
  },
}

const getEmployeeCustomInfo: ActionDefinition = {
  title: 'Get Employee Custom Info',
  description: 'Retrieve custom information about an employee by their ID and specified fields.',
  input: {
    schema: z.object({
      id: employeeId,
      fields: z
        .array(z.string().min(1))
        .min(1)
        .title('Custom Fields')
        .describe('List of custom field names to retrieve for the employee.'),
    }),
  },
  output: {
    schema: bambooHrEmployeeCustomInfoResponse,
  },
}

const getEmployeePhoto: ActionDefinition = {
  title: 'Get Employee Photo',
  description: 'Retrieve the photo of an employee by their ID and specified size.',
  input: {
    schema: z.object({
      id: employeeId,
      size: z
        .enum(['original', 'large', 'medium', 'small', 'xs'])
        .title('Photo Size')
        .describe('Size of the photo to retrieve.'),
    }),
  },
  output: {
    schema: z.object({
      blob: z.instanceof(Blob).title('Photo Blob').describe('Binary data of the employee photo.'),
    }),
  },
}

const listEmployees: ActionDefinition = {
  title: 'List Employees',
  description:
    'Retrieve a list of all employees with IDs and names. Warning: this endpoint may not be enabled in your workspace.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      employees: z
        .array(
          z.object({
            id: employeeId,
            displayName: z.string().title('Display Name').describe("Employee's display name."),
          })
        )
        .title('Employees')
        .describe('List of employees in the directory. Includes only ID and display name.'),
    }),
  },
}

const getCompanyInfo: ActionDefinition = {
  title: 'Get Company Info',
  description: 'Retrieve information about the company.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: bambooHrCompanyInfo,
  },
}

export const actions = {
  getEmployeeBasicInfo,
  getEmployeeSensitiveInfo,
  getEmployeeCustomInfo,
  getEmployeePhoto,
  listEmployees,
  getCompanyInfo,
} as const
