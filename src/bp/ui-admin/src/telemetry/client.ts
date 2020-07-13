import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

interface EventPackageInfoType {
  [key: string]: {
    timeout: string
    getPackage: Function
  }
}

export const axiosConfig = {
  baseURL: window.TELEMETRY_URL,
  headers: {
    withCredentials: false
  }
}

const dataSchemaVersion = '1.0.0'

const telemetrySchemaVersion = '1.0.0'

const pathsInReduxTracked: string[] = ['user.profile.email', 'version.currentVersion', 'license.licensing.isPro']

const eventPackageInfo: EventPackageInfoType = {}

const getEventLock = (event: string) => {
  const eventLock = window.localStorage.getItem(event)

  if (eventLock !== null) {
    return JSON.parse(eventLock)
  }

  return null
}

const setEventLock = (event: string, timeout?: string) => {
  const currentTime = moment().valueOf()

  const pkg = eventPackageInfo[event].getPackage()

  const lock = {
    package: pkg,
    expiresAt: (timeout ? ms(timeout) : ms(eventPackageInfo[event].timeout)) + currentTime
  }

  window.localStorage.setItem(event, JSON.stringify(lock))
}

const checkStoreInfoReceived = () =>
  !pathsInReduxTracked.find(pathInRedux => _.get(store.getState(), pathInRedux) === undefined)

export const addTelemetryEvent = (name: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[name] = {
    timeout,
    getPackage
  }
}

const checkTelemetry = async (event_name: string) => {
  const event_lock = getEventLock(event_name)

  if (event_lock && event_lock.expiresAt < moment().valueOf()) {
    try {
      await sendTelemetryEvent(event_lock.package, event_name)
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

  setTimeout(() => {
    if (checkStoreInfoReceived() && window.TELEMETRY_URL) {
      for (const event in eventPackageInfo) {
        !getEventLock(event) && setEventLock(event, '0s')
      }

      for (const event_name in eventPackageInfo) {
        checkTelemetry(event_name).catch(err => {
          console.error(err)
        })
      }
    }
  }, ms('5s'))
}

const sendTelemetryEvent = async (data: object, event: string) => {
  const pkg = {
    schema: telemetrySchemaVersion,
    uuid: uuid.v4(),
    timestamp: new Date().toISOString(),
    bp_release: store.getState().version.currentVersion,
    bp_license: store.getState().license.licensing.isPro ? 'pro' : 'community',
    event_type: event,
    source: 'client',
    event_data: {
      schema: dataSchemaVersion,
      ...data
    }
  }

  await axios.post('/', pkg, axiosConfig)

  setEventLock(event)
}
