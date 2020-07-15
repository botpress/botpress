import axios from 'axios'
import { lang } from 'botpress/shared'
import { getSchema, ServerStats, TelemetryEvent, TelemetryEventData } from 'common/telemetry'
import _ from 'lodash'
import ms from 'ms'
import { AppState } from '~/reducers'

import store from '../store'

type DataCollector = () => TelemetryEventData

interface UIEventsCollector {
  refreshInterval: number
  collectData: DataCollector
}

const REQUIRED_ITEMS_IN_STORE = [
  'user.profile.email',
  'server.serverConfig.env',
  'server.serverConfig.live',
  'server.serverConfig.config',
  'license.licensing.status',
  'license.licensing.fingerprints.cluster_url'
]

const eventCollectorStore: _.Dictionary<UIEventsCollector> = {}

const getEventExpiry = (eventName: string) => {
  const expiryAsString = window.localStorage.getItem(eventName)
  return expiryAsString ? ms(expiryAsString) : null
}

const setEventExpiry = (eventName: string) => {
  const expiry = Date.now() + eventCollectorStore[eventName].refreshInterval
  window.localStorage.setItem(eventName, expiry.toString())
}

const isReadyToSendEvents = (): boolean => {
  const allItemsInStore = REQUIRED_ITEMS_IN_STORE.every(path => _.get(store.getState(), path) !== undefined)
  return !!window.TELEMETRY_URL && allItemsInStore
}

export const addEventCollector = (eventName: string, interval: string, collector: DataCollector) => {
  eventCollectorStore[eventName] = {
    refreshInterval: ms(interval),
    collectData: collector
  }
}

// TODO refactor this, it does too many things
const sendEventIfReady = async (eventName: string) => {
  const expiry = getEventExpiry(eventName)

  if (!expiry || expiry < Date.now()) {
    try {
      const eventData = eventCollectorStore[eventName].collectData()
      const event = makeTelemetryEvent(eventName, eventData)

      await sendTelemetryEvents([event])

      setEventExpiry(eventName)
    } catch (err) {
      console.error(`Could not send the telemetry package to the storage server`, err)
    }
  }
}

const uiLanguageCollector: DataCollector = () => {
  const state = store.getState() as AppState
  return {
    // TODO add schema version
    user: {
      email: _.get(state, 'user.profile.email'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    language: lang.getLocale()
  }
}

export const startTelemetry = () => {
  addEventCollector('ui_language', '8h', uiLanguageCollector)

  const interval = setInterval(async () => {
    if (!isReadyToSendEvents()) {
      return
    }

    const eventNames = Object.keys(eventCollectorStore)
    await Promise.all(eventNames.map(sendEventIfReady))

    clearInterval(interval)
  }, ms('1s'))
}

const makeTelemetryEvent = (event_type: string, event_data: TelemetryEventData): TelemetryEvent => {
  const state = store.getState() as AppState

  const serverStats: ServerStats = {
    externalUrl: state.server.serverConfig.live.EXTERNAL_URL,
    botpressVersion: state.server.serverConfig.config.version,
    clusterEnabled: state.server.serverConfig.env.CLUSTER_ENABLED || false,
    os: 'TempleOs', // À changer lorsque disponible
    bpfsStorage: state.server.serverConfig.env.BPFS_STORAGE || '',
    dbType: state.server.serverConfig.env.DATABASE_URL ? 'postgres' : 'sqlite',
    machineUUID: 'abcdefg1234567', // À changer lorsque disponible
    fingerprint: state.license.licensing.fingerprints.cluster_url,
    license: {
      type: state.server.serverConfig.env.PRO_ENABLED || false ? 'pro' : 'ce',
      status: state.license.licensing.status
    }
  }

  return {
    ...getSchema(serverStats, 'client'),
    event_type,
    event_data
  }
}

export const sendTelemetryEvents = async (events: TelemetryEvent[]) => {
  try {
    await axios.post(window.TELEMETRY_URL, events)
    return 'ok'
  } catch (err) {
    console.error('Could not send the telemetry packages to the storage server', err)
    return 'fail'
  }
}
