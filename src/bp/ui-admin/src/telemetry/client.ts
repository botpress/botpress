import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

interface StoreInfoType {
  [key: string]: Function
}

interface EventPackageInfoType {
  [key: string]: {
    locked: boolean
    timeout: string
    getPackage: Function
  }
}

const telemetrySchemaVersion = '1.0.0'
const dataSchemaVersion = '1.0.0'

export const axiosConfig = {
  baseURL: window.TELEMETRY_URL,
  headers: {
    withCredentials: false
  }
}

const storeInfos: StoreInfoType = {}

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

const checkStoreInfoReceived = () => !Object.keys(storeInfos).find(info => storeInfos[info]() === undefined)

export const trackReduxStoreInfo = (name: string, pathInStore: string) => {
  storeInfos[name] = () => {
    return _.get(store.getState(), pathInStore)
  }
}

export const getTrackedReduxStoreInfo = (name: string) => {
  if (storeInfos[name]) {
    return storeInfos[name]()
  } else {
    throw `The information "${name}" asked is not tracked by the telemetry module. Consider adding it to the tracked redux store info.`
  }
}

export const addTelemetryEvent = (name: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[name] = {
    locked: getEventLockTimeout(name) >= 0,
    timeout,
    getPackage
  }
}

const checkTelemetry = async () => {
  for (const eventName in eventPackageInfo) {
    if (!eventPackageInfo[eventName].locked) {
      toggleLock(eventName)

      try {
        const pkg = eventPackageInfo[eventName].getPackage()

        if (typeof pkg === 'object') {
          await sendTelemetryEvent(pkg, eventName)
        } else {
          console.error('The package received was incorrect', pkg)
        }
      } catch (err) {
        console.error(`Could not send the telemetry package to the storage server`, err)
      }
    }
  }
}

export const startTelemetry = () => {
  trackReduxStoreInfo('email', 'user.profile.email')

  trackReduxStoreInfo('bp_release', 'version.currentVersion')

  trackReduxStoreInfo('bp_license', 'license.licensing.isPro')

  addTelemetryEvent('ui_language', '8h', () => {
    return {
      user: {
        email: getTrackedReduxStoreInfo('email'),
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
      checkTelemetry().catch(err => {
        console.error(err)
      })
    }
  }, ms('30s'))
}

const sendTelemetryEvent = async (data: object, event: string) => {
  await axios.post(
    '/',
    {
      schema: telemetrySchemaVersion,
      uuid: uuid.v4(),
      timestamp: new Date().toISOString(),
      bp_release: getTrackedReduxStoreInfo('bp_release'),
      bp_license: getTrackedReduxStoreInfo('bp_license') ? 'pro' : 'community',
      event_type: event,
      source: 'client',
      event_data: {
        schema: dataSchemaVersion,
        ...data
      }
    },
    axiosConfig
  )
  addEventLockTimeout(event, ms(eventPackageInfo[event].timeout))
}
