import axios from 'axios'
import _ from 'lodash'
import ms from 'ms'

import { Schema } from '../../../common/telemetry'
import api from '../api'

import { axiosConfig } from './client'

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

    const status = await postStorageServer(events)

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

const postStorageServer = async (events: Schema[]) => {
  const post = events.map(e => ({ ...e, source: 'client' }))

  try {
    await axios.post('/', post, axiosConfig)

    return 'ok'
  } catch (err) {
    console.error('Could not send the telemetry packages to the storage server', err)

    return 'fail'
  }
}

export const setupServerPackageLoop = () => {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage().catch(), ms('1h'))
}
