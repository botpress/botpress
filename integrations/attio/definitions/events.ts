import { EventDefinition, z } from '@botpress/sdk'
import { baseIdentifierSchema } from './common'

const recordEventSchema = z.object({
  event_type: z.string().title('Event Type').describe('The type of event'),
  id: baseIdentifierSchema.extend({ record_id: z.string().title('Record ID').describe('The record identifier') }),
  actor: z.object({
    type: z.string().title('Actor Type').describe('The type of actor (e.g., workspace-member)'),
    id: z.string().title('Actor ID').describe('The actor identifier'),
  }),
})

const recordCreated: EventDefinition = {
  title: 'Record Created',
  description: 'A new record has been created in Attio',
  schema: recordEventSchema.extend({ event_type: z.literal('record.created') }),
}

const recordUpdated: EventDefinition = {
  title: 'Record Updated',
  description: 'A record has been updated in Attio',
  schema: recordEventSchema.extend({ event_type: z.literal('record.updated') }),
}

const recordDeleted: EventDefinition = {
  title: 'Record Deleted',
  description: 'A record has been deleted in Attio',
  schema: recordEventSchema.extend({ event_type: z.literal('record.deleted') }),
}

export const events = {
  recordCreated,
  recordUpdated,
  recordDeleted,
}
