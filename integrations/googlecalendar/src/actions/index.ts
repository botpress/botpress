import { createEvent } from './create-event'
import { deleteEvent } from './delete-event'
import { listEvents } from './list-events'
import sync from './sync'
import { updateEvent } from './update-event'
import * as bp from '.botpress'

export default {
  ...sync,
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
} satisfies bp.IntegrationProps['actions']
