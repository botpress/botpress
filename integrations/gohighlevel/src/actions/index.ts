import { createContact } from './create-contact'
import { updateContact } from './update-contact'
import { getContact } from './get-contact'
import { deleteContact } from './delete-contact'
import { upsertContact } from './upsert-contact'
import { getContactsByBusinessId } from './get-contacts-by-business-id'
import { getOpportunity } from './get-opportunity'
import { deleteOpportunity } from './delete-opportunity'
import { updateOpportunity } from './update-opportunity'
import { createOpportunity } from './create-opportunity'
import { updateOpportunityStatus } from './update-opportunity-status'
import { upsertOpportunity } from './upsert-opportunity'
import { listOrders } from './list-orders'
import { getOrderById } from './get-order-by-id'
import { getCalendarEvents } from './get-calendar-event'
import { getAppointment } from './get-appointment'
import { updateAppointment } from './update-appointment'
import { createAppointment } from './create-appointment'
import { deleteEvent } from './delete-event'
import { makeApiCall } from './make-api-call'

export default {
  createContact,
  updateContact,
  getContact,
  deleteContact,
  upsertContact,
  getContactsByBusinessId,
  getOpportunity,
  deleteOpportunity,
  updateOpportunity,
  createOpportunity,
  updateOpportunityStatus,
  upsertOpportunity,
  listOrders,
  getOrderById,
  getCalendarEvents,
  getAppointment,
  updateAppointment,
  createAppointment,
  deleteEvent,
  makeApiCall,
}
