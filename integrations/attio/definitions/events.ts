import { EventDefinition, z } from '@botpress/sdk'
import { recordEventSchema } from 'src/schemas'

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
