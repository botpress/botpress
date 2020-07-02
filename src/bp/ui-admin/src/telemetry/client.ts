import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

import { EventData, EventPackageInfoType, StoreInfoType, TelemetryPackage } from './telemetry_type'

const telemetryPackageVersion = '1.0.0'
const dataClusterVersion = '1.0.0'

export const endpoint = 'https://telemetry.botpress.dev'

export const corsConfig = {
  baseURL: endpoint,
  headers: {
    withCredentials: false
  }
}

const storeInfos: StoreInfoType = {}

const eventPackageInfo: EventPackageInfoType = {}

const switchLock = (lockKey: string) => {
  if (_.has(eventPackageInfo, lockKey)) {
    eventPackageInfo[lockKey].locked = !eventPackageInfo[lockKey].locked
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
  setTimeout(() => switchLock(event), timeout)
  window.localStorage.setItem(event, (timeout + moment().valueOf()).toString())
}

const checkStoreInfoReceived = () => {
  let check = true
  for (const infoName in storeInfos) {
    check = check && getStoreInfo(infoName) !== '' && getStoreInfo(infoName) !== undefined
  }
  return check
}

export const addStoreInfo = (name: string, pathInStore: string) => {
  storeInfos[name] = {
    storedInfo: '',
    loadInfo: function() {
      storeInfos[name].storedInfo = _.get(store.getState(), pathInStore)
    }
  }
}

export const addStoreInfoFormatted = (name: string, pathInStore: string, formatter: Function) => {
  storeInfos[name] = {
    storedInfo: '',
    loadInfo: () => {
      storeInfos[name].storedInfo = formatter(_.get(store.getState(), pathInStore))
    }
  }
}

export const getStoreInfo = (name: string) => {
  if (storeInfos[name]) {
    return storeInfos[name].storedInfo
  } else {
    throw `The information "${name}" asked is not tracked by the telemetry module. Maybe it was not added before it's use?`
  }
}

export const addTelemetryEvent = (name: string, timeout: string, getPackage: Function) => {
  eventPackageInfo[name] = {
    locked: getEventTimeout(name) >= 0,
    timeout: timeout,
    getPackage: getPackage
  }
}

const checkTelemetry = async () => {
  for (const event in eventPackageInfo) {
    if (!eventPackageInfo[event].locked) {
      switchLock(event)

      await sendTelemetry(getTelemetryPackage(event, eventPackageInfo[event].getPackage()), event)
    }
  }
}

export const startTelemetry = () => {
  addStoreInfo('email', 'user.profile.email')

  addStoreInfo('bp_release', 'version.currentVersion')

  addStoreInfoFormatted('bp_license', 'license.licensing.isPro', (info: any) => {
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
      setTimeout(() => switchLock(event), getEventTimeout(event))
    }
  }

  store.subscribe(() => {
    for (const infoName in storeInfos) {
      storeInfos[infoName].loadInfo()
    }

    if (checkStoreInfoReceived()) {
      checkTelemetry().catch(err => {
        console.log(err)
      })
    }
  })
}

const getTelemetryPackage = (event_type: string, data: object): TelemetryPackage => {
  const baseCluster: EventData = {
    schema: dataClusterVersion
  }
  const event_data = _.assign(baseCluster, data)

  return {
    schema: telemetryPackageVersion,
    uuid: uuid.v4(),
    timestamp: new Date().toISOString(),
    bp_release: getStoreInfo('bp_release'),
    bp_license: getStoreInfo('bp_license'),
    event_type: event_type,
    source: 'client',
    event_data: event_data
  }
}

const sendTelemetry = async (data: TelemetryPackage, event: string) => {
  await axios.post('/', data, corsConfig)
  addEventTimeout(event, ms(eventPackageInfo[event].timeout))
}
