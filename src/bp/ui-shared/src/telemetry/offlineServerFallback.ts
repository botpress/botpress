import axios, { AxiosInstance } from 'axios'
import { TelemetryEvent } from 'common/telemetry'
import ms from 'ms'

export const sendEventsToTelemetryServer = async (events: TelemetryEvent[]) => {
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

export const startOfflineTelemetryFallback = (api: AxiosInstance) => {
  sendSavedEventsRecursive()
    .then(async () => {
      setInterval(async () => await sendSavedEventsRecursive(), ms('30m'))
    })
    .catch() // silently fail

  async function sendSavedEventsRecursive() {
    const events = await getSavedEvents()
    if (!events.length) {
      return // break recursivity
    }
    const success = await sendEventsToTelemetryServer(events)
    await sendFeedback(events, success)

    await sendSavedEventsRecursive()
  }

  async function getSavedEvents(): Promise<TelemetryEvent[]> {
    try {
      const { data } = await api.get(`/telemetry/events`)
      return data
    } catch (err) {
      return []
    }
  }

  async function sendFeedback(events: TelemetryEvent[], success: boolean): Promise<void> {
    const payload = { events: events.map(e => e.uuid), success }
    return api.post(`/telemetry/feedback`, payload)
  }
}
