import _ from 'lodash'
import ms from 'ms'

import api from '../api'

import { sendTelemetry } from './client'

const serverUrlPayloads = '/admin/telemetry-payloads'
const serverUrlFeedback = '/admin/telemetry-feedback'

const sendServerPackage = async () => {
  try {
    const {
      data: { events }
    } = await api.getSecured().get(serverUrlPayloads)

    if (_.isEmpty(events)) {
      return
    }

    const post = events.map(e => ({ ...e, source: 'client' }))

    const status = await sendTelemetry(post)

    await api.getSecured().post(serverUrlFeedback, { events: events.map(e => e.uuid), status })

    if (status === 'fail') {
      return
    }
  } catch (err) {
    console.error('Could not access the botpress server', err)

    return
  }

  await sendServerPackage()
}

export const setupOfflineTelemetryFallback = () => {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage().catch(), ms('1h'))
}
