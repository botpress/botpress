import * as sdk from '@botpress/sdk'
import { bookEvent } from './actions/bookEvent'
import { generateLink } from './actions/generateLink'
import { getAvailableTimeSlots } from './actions/getAvailableTimeSlots'
import { getEventTypes } from './actions/getEventTypes'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const calcomApiKey = props.ctx.configuration.calcomApiKey
    if (!calcomApiKey || !calcomApiKey.startsWith('cal_')) {
      throw new sdk.RuntimeError('The Cal.com API key is not configured. Please set it up in the configuration.')
    }
  },
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
