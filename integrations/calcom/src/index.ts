import { bookEvent } from './actions/bookEvent'
import { generateLink } from './actions/generateLink'
import { getAvailableTimeSlots } from './actions/getAvailableTimeSlots'
import { getEventTypes } from './actions/getEventTypes'
import * as bp from '.botpress'

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
