import { z, type EventDefinition } from '@botpress/sdk'
import { bambooHrEmployeeWebhookFields } from './bamboohr-schemas'
import { employeeId, timestamp } from './common'

const sharedEventFields = z.object({
  id: employeeId,
  timestamp,
})

const employeeCreated: EventDefinition = {
  title: 'Employee Created',
  description: 'Triggers when a new employee is created in BambooHR.',
  schema: sharedEventFields,
}

const employeeDeleted: EventDefinition = {
  title: 'Employee Deleted',
  description:
    'Triggers when an employee is deleted from BambooHR. Terminating employees will trigger the "Employee Updated" event instead.',
  schema: sharedEventFields,
}

const employeeUpdated: EventDefinition = {
  title: 'Employee Updated',
  description: 'Triggers when an existing employee is updated in BambooHR.',
  schema: sharedEventFields.extend({
    fields: bambooHrEmployeeWebhookFields
      .title('Fields')
      .describe('All fields subscribed to for the employee, including unchanged fields.'),
    changedFields: z
      .array(z.string())
      .title('Changed Fields')
      .describe('List of fields that were changed in this event.'),
  }),
}

export const events = {
  employeeCreated,
  employeeDeleted,
  employeeUpdated,
} as const
