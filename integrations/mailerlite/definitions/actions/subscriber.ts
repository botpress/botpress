import { z, ActionDefinition } from '@botpress/sdk'
import { subscriberSchema } from 'definitions/schemas'

const fetchSubscriber: ActionDefinition = {
  title: 'Fetch Subscriber',
  description: 'Search subscriber by id or by email',
  input: {
    schema: z.object({
      id: z.string().title('Subscriber id').describe('Subscriber id to search for').optional(),
      email: z.string().title('Subscriber email').describe('Subscriber email to search for').optional(),
    }),
  },
  output: {
    schema: subscriberSchema,
  },
}

const createOrUpsertSubscriber: ActionDefinition = {
  title: 'Create or Upsert Subscriber',
  description: 'Create or update existing subscriber with given fields, identified by their email or id',
  input: {
    schema: z.object({
      email: z.string().title('Email').describe('Email of the subscriber to create/upsert'),
      name: z.string().title('Name').describe('First name of the subscriber').optional(),
      last_name: z.string().title('Last Name').describe('Last name of the subscriber').optional(),
      company: z.string().title('Company').describe('Company name').optional(),
      country: z.string().title('Country').describe('Country').optional(),
      city: z.string().title('City').describe('City').optional(),
      phone: z.string().title('Phone').describe('Phone number').optional(),
      state: z.string().title('State').describe('State/Province').optional(),
      zip: z.string().title('ZIP Code').describe('ZIP/Postal code').optional(),
      customFields: z
        .string()
        .displayAs<any>({
          id: 'text',
          params: {
            allowDynamicVariable: true,
            growVertically: true,
            multiLine: true,
            resizable: true,
          },
        })
        .title('Custom Fields (JSON)')
        .describe('JSON string containing key, value pairs of custom fields')
        .optional(),
    }),
  },
  output: {
    schema: subscriberSchema,
  },
}

const deleteSubscriber: ActionDefinition = {
  title: 'Delete Subscriber',
  description: 'Delete existing subscriber by subscriber id',
  input: {
    schema: z.object({
      id: z.string().title('Subscriber id').describe('Id of the subscriber to remove'),
    }),
  },
  output: {
    schema: z.object({
      success: z
        .boolean()
        .title('Delete success')
        .describe('Returns boolean depending on the return code of the action'),
      message: z.string().title('Success messsage').describe('Explains return status'),
    }),
  },
}

export const actions = {
  fetchSubscriber,
  createOrUpsertSubscriber,
  deleteSubscriber,
} as const
