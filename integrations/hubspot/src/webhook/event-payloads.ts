import * as sdk from '@botpress/sdk'

const OBJECT_TYPES = {
  CONTACT: '0-1',
  COMPANY: '0-2',
  TICKET: '0-5',
  LEAD: '0-136',
} as const

const BASE_EVENT_PAYLOAD = sdk.z.object({
  eventId: sdk.z.string().min(1),
  changeSource: sdk.z.literal('CRM'),
  occurredAt: sdk.z.number().positive(),
  subscriptionType: sdk.z.enum(['object.creation', 'object.deletion']),
  attemptNumber: sdk.z.number().positive(),
  objectId: sdk.z.number(),
  objectTypeId: sdk.z.enum([OBJECT_TYPES.COMPANY, OBJECT_TYPES.CONTACT, OBJECT_TYPES.LEAD, OBJECT_TYPES.TICKET]),
})

type BaseEvent = sdk.z.infer<typeof BASE_EVENT_PAYLOAD>

const CONTACT_CREATED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.creation'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.CONTACT),
})

export type ContactCreatedEvent = sdk.z.infer<typeof CONTACT_CREATED_EVENT>

export const isContactCreatedEvent = (event: BaseEvent): event is ContactCreatedEvent =>
  event.subscriptionType === 'object.creation' && event.objectTypeId === OBJECT_TYPES.CONTACT

const CONTACT_DELETED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.deletion'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.CONTACT),
})

export type ContactDeletedEvent = sdk.z.infer<typeof CONTACT_DELETED_EVENT>

export const isContactDeletedEvent = (event: BaseEvent): event is ContactDeletedEvent =>
  event.subscriptionType === 'object.deletion' && event.objectTypeId === OBJECT_TYPES.CONTACT

const COMPANY_CREATED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.creation'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.COMPANY),
})

export type CompanyCreatedEvent = sdk.z.infer<typeof COMPANY_CREATED_EVENT>

export const isCompanyCreatedEvent = (event: BaseEvent): event is CompanyCreatedEvent =>
  event.subscriptionType === 'object.creation' && event.objectTypeId === OBJECT_TYPES.COMPANY

const COMPANY_DELETED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.deletion'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.COMPANY),
})

export type CompanyDeletedEvent = sdk.z.infer<typeof COMPANY_DELETED_EVENT>

export const isCompanyDeletedEvent = (event: BaseEvent): event is CompanyDeletedEvent =>
  event.subscriptionType === 'object.deletion' && event.objectTypeId === OBJECT_TYPES.COMPANY

const TICKET_CREATED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.creation'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.TICKET),
})

export type TicketCreatedEvent = sdk.z.infer<typeof TICKET_CREATED_EVENT>

export const isTicketCreatedEvent = (event: BaseEvent): event is TicketCreatedEvent =>
  event.subscriptionType === 'object.creation' && event.objectTypeId === OBJECT_TYPES.TICKET

const TICKET_DELETED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.deletion'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.TICKET),
})

export type TicketDeletedEvent = sdk.z.infer<typeof TICKET_DELETED_EVENT>

export const isTicketDeletedEvent = (event: BaseEvent): event is TicketDeletedEvent =>
  event.subscriptionType === 'object.deletion' && event.objectTypeId === OBJECT_TYPES.TICKET

const LEAD_CREATED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.creation'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.LEAD),
})

export type LeadCreatedEvent = sdk.z.infer<typeof LEAD_CREATED_EVENT>

export const isLeadCreatedEvent = (event: BaseEvent): event is LeadCreatedEvent =>
  event.subscriptionType === 'object.creation' && event.objectTypeId === OBJECT_TYPES.LEAD

const LEAD_DELETED_EVENT = BASE_EVENT_PAYLOAD.extend({
  subscriptionType: sdk.z.literal('object.deletion'),
  objectTypeId: sdk.z.literal(OBJECT_TYPES.LEAD),
})

export type LeadDeletedEvent = sdk.z.infer<typeof LEAD_DELETED_EVENT>

export const isLeadDeletedEvent = (event: BaseEvent): event is LeadDeletedEvent =>
  event.subscriptionType === 'object.deletion' && event.objectTypeId === OBJECT_TYPES.LEAD

export const BATCH_UPDATE_EVENT_PAYLOAD = sdk.z.array(
  sdk.z.union([
    CONTACT_CREATED_EVENT,
    CONTACT_DELETED_EVENT,
    COMPANY_CREATED_EVENT,
    COMPANY_DELETED_EVENT,
    TICKET_CREATED_EVENT,
    TICKET_DELETED_EVENT,
    LEAD_CREATED_EVENT,
    LEAD_DELETED_EVENT,
  ])
)

export type BatchUpdateEventPayload = sdk.z.infer<typeof BATCH_UPDATE_EVENT_PAYLOAD>
