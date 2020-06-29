import axios from 'axios'
import ms from 'ms'

import api from './../api'
import { corsConfig, endpoint } from './client'

const serverUrl = '/admin/telemetry'

async function sendServerPackage() {
  try {
    const {
      data: { events }
    } = await api.getSecured().get(serverUrl)

    const feedback = { events: [], status: '' }

    if (events) {
      events.map(event => (event.source = 'client'))

      feedback.events = events.map(event => event.uuid)

      try {
        await axios.post(endpoint, events, corsConfig)
        feedback['status'] = 'ok'
      } catch (err) {
        feedback['status'] = 'fail'
        console.log('Could not send the telemetry packages to the storage server', err)
      }
    }

    await api.getSecured().post(serverUrl, feedback)
  } catch (err) {
    console.log('Could not access the botpress server', err)
  }
}

export function setupServerPackageLoop() {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage().catch(), ms('1h'))
}
