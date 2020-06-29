import axios from 'axios'
import shared from 'botpress/shared'
import { createHash } from 'crypto'
import _ from 'lodash'
import ms from 'ms'
import uuid from 'uuid'

import store from '../store'

export interface StoreInfoBody {
  storedInfo: string
  loadInfo: Function
}

export interface StoreInfoType {
  [key: string]: StoreInfoBody
}

export const storeInfos: StoreInfoType = {}

export interface EventPackageInfoType {
  [key: string]: EventPackageInfoBody
}

export interface EventPackageInfoBody {
  locked: boolean
  timeout: string
  getPackage: Function
}

export const eventPackageInfo: EventPackageInfoType = {}

export type dataType = string | number | boolean | object

export interface EventData {
  schema: string
  [key: string]: dataType
}

export interface TelemetryPackage {
  schema: string
  uuid: string
  timestamp: string
  bp_release: string
  bp_license: string
  event_type: string
  source: string
  event_data: EventData
}

export const telemetryPackageVersion = '1.0.0'
export const dataClusterVersion = '1.0.0'

export const endpoint = 'https://telemetry.botpress.dev'

export const corsConfig = {
  withCredentials: false
}

export function toHash(content: string) {
  return createHash('sha256')
    .update(content)
    .digest('hex')
}

export function switchLock(lockKey: string) {
  if (_.has(eventPackageInfo, lockKey)) {
    eventPackageInfo[lockKey].locked = !eventPackageInfo[lockKey].locked
  }
}

export function setupEventsTimeout() {
  for (const event in eventPackageInfo) {
    if (isTimeoutLocalStorage(event)) {
      switchLock(event)
      setTimeout(() => switchLock(event), getTimeoutLocalStorage(event))
    }
  }
}

function isTimeoutLocalStorage(event: string) {
  const item = window.localStorage.getItem(event)
  if (item !== null) {
    const timeout = parseInt(item) - new Date().getTime()
    if (timeout >= 0) {
      return true
    }
    window.localStorage.removeItem(event)
  }
  return false
}

function getTimeoutLocalStorage(event: string) {
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

function addTimeoutLocalStorage(event: string, timeout: number) {
  setTimeout(() => switchLock(event), timeout)
  window.localStorage.setItem(event, (timeout + new Date().getTime()).toString())
}

export function checkStoreInfoReceived() {
  let check = true
  for (const infoName in storeInfos) {
    check = check && getStoreInfo(infoName) !== '' && getStoreInfo(infoName) !== undefined
  }
  return check
}

export function addStoreInfo(name: string, pathInStore: string) {
  storeInfos[name] = {
    storedInfo: '',
    loadInfo: function() {
      // @ts-ignore
      storeInfos[name].storedInfo = _.get(store.getState(), pathInStore)
    }
  }
}

export function addStoreInfoFormatted(name: string, pathInStore: string, formatter: Function) {
  storeInfos[name] = {
    storedInfo: '',
    loadInfo: () => {
      // @ts-ignore
      storeInfos[name].storedInfo = formatter(_.get(store.getState(), pathInStore))
    }
  }
}

export function getStoreInfo(name: string) {
  if (storeInfos[name]) {
    return storeInfos[name].storedInfo
  } else {
    throw `The information "${name}" asked is not tracked by the telemetry module. Maybe it was not added before it's use?`
  }
}

export function addTelemetryEvent(name: string, timeout: string, getPackage: Function) {
  eventPackageInfo[name] = {
    locked: false,
    timeout: timeout,
    getPackage: getPackage
  }
}

export async function checkTelemetry() {
  for (const event in eventPackageInfo) {
    if (!eventPackageInfo[event].locked) {
      switchLock(event)

      await sendTelemetry(getTelemetryPackage(event, eventPackageInfo[event].getPackage()), event)
    }
  }
}

function setupTelemetry() {
  addStoreInfo('email', 'user.profile.email')

  addStoreInfo('bp_release', 'version.currentVersion')

  addStoreInfoFormatted('bp_license', 'license.licensing.isPro', (info: any) => {
    return !!info ? 'pro' : 'community'
  })

  addTelemetryEvent('ui_language', '8h', () => {
    return {
      user: {
        email: toHash(getStoreInfo('email')),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      language: shared.lang.getLocale()
    }
  })
}

export function startTelemetry() {
  setupEventsTimeout()

  setupTelemetry()

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

export function getDataCluster(data: object): EventData {
  const baseCluster: EventData = {
    schema: dataClusterVersion
  }
  return _.assign(baseCluster, data)
}

export function getTelemetryPackage(event_type: string, data: object): TelemetryPackage {
  return {
    schema: telemetryPackageVersion,
    uuid: uuid.v4(),
    timestamp: new Date().toISOString(),
    bp_release: getStoreInfo('bp_release'),
    bp_license: getStoreInfo('bp_license'),
    event_type: event_type,
    source: 'client',
    event_data: getDataCluster(data)
  }
}

export async function sendTelemetry(data: TelemetryPackage, event: string) {
  await axios.post(endpoint, data, corsConfig)
  addTimeoutLocalStorage(event, ms(eventPackageInfo[event].timeout))
}
