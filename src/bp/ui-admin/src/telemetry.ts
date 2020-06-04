import axios from 'axios'
import shared from 'botpress/shared'
import { createHash } from 'crypto'
import _ from 'lodash'
import ms from 'ms'
import uuid from 'uuid'
import api from '~/api'

import store from './store'

export const telemetryPackageVersion = '1.0.0'
export const dataClusterVersion = '1.0.0'

const endpointMock = 'http://sarscovid2.ddns.net:8000/mock'
const endpoint = 'https://telemetry.botpress.dev/'

function toHash(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

const info = {
  bp_license: '',
  bp_release: '',
  email: ''
}

const serverUrl = window.location.origin + '/telemetry'

const corsConfig = {
  withCredentials: false
}

export interface Lock {
  [key: string]: boolean
}

const locks: Lock = {}

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
  eventsType.forEach((it) => {
    addLock(it)
    setupLockTimeout(it)
  })
}

export function isTimeout(event: string) {
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

export function getTimeout(event: string) {
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

export function addTimeout(event: string, timeout: number) {
  window.localStorage.setItem(event, (timeout + new Date().getTime()).toString())
  setTimeout(() => changeLock(event), timeout)
}

export function checkInfoReceived() {
  return !_.includes(info, '')
}

export function getServerFeedback() {
  const pkgStr = window.localStorage.getItem('feedbackToSend')
  let packages = []
  if (pkgStr !== null) {
    packages = JSON.parse(pkgStr)
  }
  return packages
}

export async function feedbacks(feedbacks) {
  const storageFeedbacks = getServerFeedback()

  const newFeedback = _.union(feedbacks, storageFeedbacks, 'uuid')

  try {
    await axios.post(serverUrl, newFeedback, corsConfig)
    window.localStorage.setItem('feedbackToSend', JSON.stringify([]))
  } catch (err) {
    window.localStorage.setItem('feedbackToSend', JSON.stringify(newFeedback))
    console.log(err)
  }
}

export async function sendServerPackage() {
  if (window.localStorage.getItem('feedbackToSend') === null) {
    window.localStorage.setItem('feedbackToSend', JSON.stringify([]))
  }

  const storageFeedbacks = getServerFeedback()

  await feedbacks(storageFeedbacks)

  const packages = await axios.get(serverUrl, corsConfig)

  let payload, url, feedbackUUID
  const listFeedbacks: Array<object> = []

  if (packages !== undefined && _.has(packages, 'data')) {
    for (const pkg of packages.data) {
      if (pkg != null) {
        payload = pkg.payload
        url = pkg.url
        feedbackUUID = payload.uuid

        try {
          await axios.post(url, payload, corsConfig)
          listFeedbacks.push({ status: 'OK', uuid: feedbackUUID })
        } catch (err) {
          listFeedbacks.push({ status: 'INACCESSIBLE', uuid: feedbackUUID })
          console.log(err)
        }
      }
    }
  }

  await feedbacks(listFeedbacks)
}

export function setupServerPackageLoop() {
  sendServerPackage().catch((err) => {
    console.log(err)
  })
  setInterval(() => {
    sendServerPackage().catch((err) => {
      console.log(err)
    })
  }, ms('1h'))
}

export function startTelemetry(event_type: string, data: dataType, name: string = 'data') {
  sendTelemetry(getTelemetryPackage(event_type, data, name), event_type)
}

export function setupTelemetry() {
  setupEventsType()

  setupServerPackageLoop()

  store.subscribe(() => {
    const state = store.getState()

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
      eventsType.forEach((event) => {
        if (!locks[event]) {
          changeLock(event)
          const data = {
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
  const baseCluster: EventData = {
    schema: dataClusterVersion
  }
  return _.assign(baseCluster, data)
}

export function getTelemetryPackage(event_type: string, data: dataType, name: string = 'data'): TelemetryPackage {
  return {
    schema: telemetryPackageVersion,
    uuid: uuid.v4(),
    timestamp: new Date().toISOString(),
    bp_release: info.bp_release,
    bp_license: info.bp_license,
    event_type: event_type,
    event_data: getDataCluster(data)
  }
}

function sendTelemetry(data: TelemetryPackage, event: string) {
  axios
    .post(endpointMock, data, {
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
    .then((res) => {
      addTimeout(event, ms('8h'))
    })
    .catch((err) => {
      changeLock(event)
    })
}
