import { createEvent } from './implementations/create-event'
import { deleteEvent } from './implementations/delete-event'

import { listEvents } from './implementations/list-events'
import { updateEvent } from './implementations/update-event'
import * as bp from '.botpress'

export const actions = {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} as const satisfies bp.IntegrationProps['actions']
