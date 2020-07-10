import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

interface EventPackageInfoType {
  [key: string]: {
    locked: boolean
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

const pathsInReduxTracked: string[] = []

const eventPackageInfo: EventPackageInfoType = {}

const toggleLock = (eventName: string) => {
  if (_.has(eventPackageInfo, eventName)) {
    eventPackageInfo[eventName].locked = !eventPackageInfo[eventName].locked
  }
}

const getEventLockTimeout = (event: string) => {
  const item = window.localStorage.getItem(event)
  if (item !== null) {
    const timeout = parseInt(item) - new Date().getTime()
    if (timeout > 0) {
      return timeout
    }
    window.localStorage.removeItem(event)
  }
  return 0
}

const addEventLockTimeout = (event: string, timeout: number) => {
  setTimeout(() => toggleLock(event), timeout)
  window.localStorage.setItem(event, (timeout + moment().valueOf()).toString())
}

const checkStoreInfoReceived = () =>
  !pathsInReduxTracked.find(pathInRedux => _.get(store.getState(), pathInRedux) === undefined)

export const addTelemetryEvent = (name: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[name] = {
    locked: getEventLockTimeout(name) >= 0,
    timeout,
    getPackage
  }
}

const checkTelemetry = async (event_name: string) => {
  if (!eventPackageInfo[event_name].locked) {
    toggleLock(event_name)

    try {
      const pkg = eventPackageInfo[event_name].getPackage()

      if (typeof pkg === 'object') {
        await sendTelemetryEvent(pkg, event_name)
      } else {
        console.error('The package received was incorrect', pkg)
      }
    } catch (err) {
      console.error(`Could not send the telemetry package to the storage server`, err)
    }
  }
}

export const startTelemetry = () => {
  pathsInReduxTracked.push('user.profile.email')

  pathsInReduxTracked.push('version.currentVersion')

  pathsInReduxTracked.push('license.licensing.isPro')

  addTelemetryEvent('ui_language', '8h', () => {
    return {
      user: {
        email: store.getState().user.profile.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      language: lang.getLocale()
    }
  })

  for (const event in eventPackageInfo) {
    if (getEventLockTimeout(event) >= 0) {
      setTimeout(() => toggleLock(event), getEventLockTimeout(event))
    }
  }

  setInterval(() => {
    if (checkStoreInfoReceived() && window.TELEMETRY_URL) {
      for (const event_name in eventPackageInfo) {
        checkTelemetry(event_name).catch(err => {
          console.error(err)
        })
      }
    }
  }, ms('30s'))
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

  addEventLockTimeout(event, ms(eventPackageInfo[event].timeout))
}
