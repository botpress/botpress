import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

import { EventPackageInfoType, StoreInfoType } from './telemetryType'

const telemetryPackageVersion = '1.0.0'
const dataClusterVersion = '1.0.0'

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

const getEventTimeout = (event: string) => {
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

const addEventTimeout = (event: string, timeout: number) => {
  setTimeout(() => toggleLock(event), timeout)
  window.localStorage.setItem(event, (timeout + moment().valueOf()).toString())
}

const checkStoreInfoReceived = () => !Object.keys(storeInfos).find(info => !storeInfos[info]())

export const addStoreInfo = (name: string, pathInStore: string, formatter?: Function) => {
  storeInfos[name] = () => {
    const value = _.get(store.getState(), pathInStore)
    return formatter ? formatter(value) : value
  }
}

export const getStoreInfo = (name: string) => {
  if (storeInfos[name]) {
    return storeInfos[name]()
  } else {
    throw `The information "${name}" asked is not tracked by the telemetry module. Maybe it was not added before it's use?`
  }
}

export const addTelemetryEvent = (name: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[name] = {
    locked: getEventTimeout(name) >= 0,
    timeout,
    getPackage
  }
}

const checkTelemetry = async () => {
  for (const eventName in eventPackageInfo) {
    if (!eventPackageInfo[eventName].locked) {
      toggleLock(eventName)

      await sendTelemetry(eventPackageInfo[eventName].getPackage(), eventName)
    }
  }
}

export const startTelemetry = () => {
  addStoreInfo('email', 'user.profile.email')

  addStoreInfo('bp_release', 'version.currentVersion')

  addStoreInfo('bp_license', 'license.licensing.isPro', (info: any) => {
    return !!info ? 'pro' : 'community'
  })

  addTelemetryEvent('ui_language', '8h', () => {
    return {
      user: {
        email: getStoreInfo('email'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      language: lang.getLocale()
    }
  })

  for (const event in eventPackageInfo) {
    if (getEventTimeout(event) >= 0) {
      setTimeout(() => toggleLock(event), getEventTimeout(event))
    }
  }

  setInterval(() => {
    if (checkStoreInfoReceived()) {
      checkTelemetry().catch(err => {
        console.error(err)
      })
    }
  }, ms('30s'))
}

const sendTelemetry = async (data: object, event: string) => {
  await axios.post(
    '/',
    {
      schema: telemetryPackageVersion,
      uuid: uuid.v4(),
      timestamp: new Date().toISOString(),
      bp_release: getStoreInfo('bp_release'),
      bp_license: getStoreInfo('bp_license'),
      event_type: event,
      source: 'client',
      event_data: {
        schema: dataClusterVersion,
        ...data
      }
    },
    axiosConfig
  )
  addEventTimeout(event, ms(eventPackageInfo[event].timeout))
}
