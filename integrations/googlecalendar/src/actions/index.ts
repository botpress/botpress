import { createEvent } from './implementations/create-event'
import { deleteEvent } from './implementations/delete-event'
import { eventCreate } from './implementations/interfaces/event-create'
import { eventDelete } from './implementations/interfaces/event-delete'
import { eventList } from './implementations/interfaces/event-list'
import { eventRead } from './implementations/interfaces/event-read'
import { eventUpdate } from './implementations/interfaces/event-update'

import { listEvents } from './implementations/list-events'
import { updateEvent } from './implementations/update-event'
import * as bp from '.botpress'

export const actions = {
  eventCreate,
  eventDelete,
  eventList,
  eventRead,
  eventUpdate,

  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} as const satisfies bp.IntegrationProps['actions']
