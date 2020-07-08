import axios from 'axios'
import _ from 'lodash'
import ms from 'ms'

import api from '../api'

import { axiosConfig } from './client'

const serverUrlPayloads = '/admin/telemetry-payloads'
const serverUrlFeedback = '/admin/telemetry-feedback'

const sendServerPackage = async () => {
  let continueLoop = true
  do {
    try {
      const {
        data: { events }
      } = await api.getSecured().get(serverUrlPayloads)

      if (_.isEmpty(events)) {
        break
      }

      let status
      try {
        await axios.post(
          '/',
          events.map(e => ({ ...e, source: 'client' })),
          axiosConfig
        )
        status = 'ok'
      } catch (err) {
        status = 'fail'
        console.error('Could not send the telemetry packages to the storage server', err)
      }

      await api.getSecured().post(serverUrlFeedback, { events: events.map(e => e.uuid), status })
    } catch (err) {
      console.error('Could not access the botpress server', err)
      continueLoop = false
    }
  } while (continueLoop)
}

export const setupServerPackageLoop = () => {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage().catch(), ms('1h'))
}
