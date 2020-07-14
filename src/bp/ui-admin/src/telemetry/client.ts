import axios from 'axios'
import { lang } from 'botpress/shared'
import { getSchema, ServerStats } from 'common/telemetry'
import _ from 'lodash'
import ms from 'ms'

import store from '../store'

interface EventPackageInfoType {
  [key: string]: {
    timeout: string
    getPackage: Function
  }
}

const clientDataSchemaVersion = '1.0.0'

const pathsInReduxTracked: string[] = [
  'user.profile.email',
  'server.serverConfig.env',
  'server.serverConfig.live',
  'server.serverConfig.config',
  'license.licensing.status',
  'license.licensing.fingerprints.cluster_url'
]

const eventPackageInfo: EventPackageInfoType = {}

const getEventExpiry = (eventName: string) => {
  const expiry = window.localStorage.getItem(eventName)

  if (expiry !== null) {
    return parseInt(expiry)
  }

  return null
}

const setEventExpiry = (eventName: string) =>
  window.localStorage.setItem(eventName, (ms(eventPackageInfo[eventName].timeout) + Date.now()).toString())

const checkStoreInfoReceived = () =>
  !pathsInReduxTracked.find(pathInRedux => _.get(store.getState(), pathInRedux) === undefined)

export const addTelemetryEvent = (eventName: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[eventName] = {
    timeout,
    getPackage
  }
}

const checkTelemetry = async (eventName: string) => {
  const expiry = getEventExpiry(eventName)

  if (!expiry || expiry <= Date.now()) {
    try {
      const pkg = eventPackageInfo[eventName].getPackage()

      const payload = makeTelemetryPayload(eventName, pkg)

      await sendTelemetry([payload])

      setEventExpiry(eventName)
    } catch (err) {
      console.error(`Could not send the telemetry package to the storage server`, err)
    }
  }
}

export const startTelemetry = () => {
  addTelemetryEvent('ui_language', '8h', () => {
    return {
      user: {
        email: store.getState().user.profile.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      language: lang.getLocale()
    }
  })

  const clear = setInterval(() => {
    if (checkStoreInfoReceived() && window.TELEMETRY_URL) {
      for (const event_name in eventPackageInfo) {
        checkTelemetry(event_name).catch()
      }
      clearInterval(clear)
    }
  }, ms('1s'))
}

const makeTelemetryPayload = (eventName: string, data: object) => {
  const state = store.getState()

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

  const pkg = {
    ...getSchema(serverStats, 'client'),
    event_type: eventName,
    event_data: {
      schema: clientDataSchemaVersion,
      ...data
    }
  }

  return pkg
}

export const sendTelemetry = async (payload: Array<object>) => {
  try {
    await axios.post(window.TELEMETRY_URL, payload)

    return 'ok'
  } catch (err) {
    console.error('Could not send the telemetry packages to the storage server', err)

    return 'fail'
  }
}
