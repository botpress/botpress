import axios, { AxiosInstance } from 'axios'
import { TelemetryEvent } from 'common/telemetry'
import _ from 'lodash'
import ms from 'ms'

export const sendTelemetry = async (events: TelemetryEvent[]) => {
  try {
    await axios.post(
      window.TELEMETRY_URL,
      events.map(e => ({ ...e, source: 'client' }))
    )
    return true
  } catch (err) {
    console.error('Could not send the telemetry packages to the storage server', err)
    return false
  }
}

export const startFallback = async (api: AxiosInstance) => {
  await sendSavedEvents(api)
  setInterval(() => sendSavedEvents(api), ms('30m'))
}

const sendSavedEvents = async (api: AxiosInstance) => {
  const events = await getSavedEvents(api)
  if (!events.length) {
    return // break recursivity
  }
  const success = await sendTelemetry(events)
  await sendFeedback(api, events, success)

  if (success) {
    await sendSavedEvents(api)
  }
}

const getSavedEvents = async (api: AxiosInstance): Promise<TelemetryEvent[]> => {
  try {
    const { data } = await api.get('/telemetry/events')
    return data
  } catch (err) {
    return []
  }
}

const sendFeedback = async (api: AxiosInstance, events: TelemetryEvent[], success: boolean): Promise<void> => {
  const payload = { events: events.map(e => e.uuid), success }
  return api.post('/telemetry/feedback', payload)
}
