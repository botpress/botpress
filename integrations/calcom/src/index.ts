import * as bp from '.botpress'

import { generateLink } from './actions/generateLink'
import { getEventTypes } from './actions/getEventTypes'
import { getAvailableTimeSlots } from './actions/getAvailableTimeSlots'
import { bookEvent } from './actions/bookEvent'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  channels: {},
  handler: async () => {},
  actions: {
    generateLink,
    getEventTypes,
    getAvailableTimeSlots,
    bookEvent,
  },
})
