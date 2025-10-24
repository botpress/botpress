import { EventDefinition, z } from '@botpress/sdk'
import { candidateSchema } from 'definitions/models/candidates'
import { webhookEvent } from './common'

export const eventTypes = z.enum(['candidate_created', 'candidate_moved'])

export const candidateCreatedSchema = webhookEvent
  .extend({
    data: candidateSchema.title('Data').describe('The candidate that was created'),
    eventType: z.literal(eventTypes.Enum.candidate_created).title('Event Type').describe('The type of event'),
  })
  .title('Data')
  .describe('Event data')

export const candidateMovedSchema = webhookEvent
  .extend({
    data: candidateSchema.title('Data').describe('The candidate that was moved'),
    eventType: z.literal(eventTypes.Enum.candidate_moved).title('Event Type').describe('The type of event'),
  })
  .title('Data')
  .describe('Event data')

export const candidateCreated = {
  title: 'Candidate Created',
  description: 'A candidate was created on a job.',
  schema: candidateCreatedSchema,
} satisfies EventDefinition

export const candidateMoved = {
  title: 'Candidate Moved',
  description: 'A candidate was moved on a job.',
  schema: candidateMovedSchema,
} satisfies EventDefinition
