import store from './store'
import axios from 'axios'
import shared from 'botpress/shared'
import uuid from 'uuid'
import _ from 'lodash'
import ms from 'ms'
import { createHash } from 'crypto'

export const telemetryPackageVersion = '1.0.0'
export const dataClusterVersion = '1.0.0'

const endpointMock = 'http://sarscovid2.ddns.net'
const endpointMockPort = '8000'
const endpointMockPath = '/mock'

function toHash(content: string) {
  return createHash('sha256')
    .update(content)
    .digest('hex')
}

let info = {
  bp_license: '',
  bp_release: '',
  email: ''
}

export interface Lock {
  [key: string]: boolean
}

let locks: Lock = {}

export type dataType = string | boolean | number | object

export interface EventData {
  schema_version: string
  [key: string]: dataType
}

export interface TelemetryPackage {
  schema_version: string
  event_id: string
  timestamp: string
  bp_release: string
  bp_license: string
  event_type: string
  event_data: EventData
}

export let eventsType: string[] = ['ui_language']

export function changeLock(lockKey: string) {
  if (_.has(locks, lockKey)) {
    locks[lockKey] = !locks[lockKey]
  }
}

function addLock(lockKey: string) {
  locks[lockKey] = false
}

export function setupLockTimeout(event: string) {
  if (isTimeout(event)) {
    changeLock(event)
    setTimeout(() => changeLock(event), getTimeout(event))
  }
}

export function setupEventsType() {
  eventsType.forEach(it => {
    addLock(it)
    setupLockTimeout(it)
  })
}

export function isTimeout(event: string) {
  let item = window.localStorage.getItem(event)
  if (item !== null) {
    let timeout = parseInt(item) - new Date().getTime()
    if (timeout >= 0) {
      return true
    }
    window.localStorage.removeItem(event)
  }
  return false
}

export function getTimeout(event: string) {
  let item = window.localStorage.getItem(event)
  if (item !== null) {
    let timeout = parseInt(item) - new Date().getTime()
    if (timeout > 0) {
      return timeout
    }
    window.localStorage.removeItem(event)
  }
  return 0
}

export function addTimeout(event: string, timeout: number) {
  window.localStorage.setItem(event, (timeout + new Date().getTime()).toString())
  setTimeout(() => changeLock(event), timeout)
}

export function checkInfoReceived() {
  return !_.includes(info, '')
}

export function startTelemetry(event_type: string, data: dataType, name: string = 'data') {
  sendTelemetry(getTelemetryPackage(event_type, data, name), event_type)
}

export function setupTelemetry() {
  setupEventsType()

  store.subscribe(() => {
    let state = store.getState()

    if (_.has(state, 'version.currentVersion') && state.version.currentVersion !== '') {
      info.bp_release = state.version.currentVersion
    }

    if (_.has(state, 'license.licensing.isPro')) {
      info.bp_license = state.license.licensing.isPro ? 'pro' : 'community'
    }

    if (_.has(state, 'user.profile.email')) {
      info.email = state.user.profile.email
    }

    if (checkInfoReceived()) {
      eventsType.forEach(event => {
        if (!locks[event]) {
          changeLock(event)
          // à changer lorsqu'il y aura plus de données à envoyer
          let data = {
            user: {
              email: toHash(info.email),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            language: shared.lang.getLocale()
          }

          startTelemetry(event, data)
        }
      })
    }
  })
}

function getDataCluster(data: dataType): EventData {
  let baseCluster: EventData = {
    schema_version: dataClusterVersion
  }
  return _.assign(baseCluster, data)
}

export function getTelemetryPackage(event_type: string, data: dataType, name: string = 'data'): TelemetryPackage {
  return {
    schema_version: telemetryPackageVersion,
    event_id: uuid.v4(),
    timestamp: new Date().toISOString(),
    bp_release: info.bp_release,
    bp_license: info.bp_license,
    event_type: event_type,
    event_data: getDataCluster(data)
  }
}

function sendTelemetry(data: TelemetryPackage, event: string) {
  console.log(data)
  console.log(JSON.stringify(data))
  console.log(new Date().toUTCString())
  axios
    .post(endpointMock.concat(':', endpointMockPort, endpointMockPath), data, {
      headers: {
        'content-type': 'application/json',
        withCredentials: false,
        timeout: 1000,
        transformRequest: [
          (data, headers) => {
            return JSON.stringify(data)
          }
        ]
      }
    })
    .then(res => {
      addTimeout(event, ms('8h'))
    })
    .catch(err => {
      changeLock(event)
    })
}
