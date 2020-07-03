import axios from 'axios'
import ms from 'ms'

import api from './../api'
import { axiosConfig } from './client'

const serverUrl = '/admin/telemetry'

const sendServerPackage = async () => {
  try {
    const {
      data: { events }
    } = await api.getSecured().get(serverUrl)

    if (!events) {
      return
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

    await api.getSecured().post(serverUrl, { events: events.map(e => e.uuid), status })
  } catch (err) {
    console.error('Could not access the botpress server', err)
  }
}

export const setupServerPackageLoop = () => {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage().catch(), ms('1h'))
}
