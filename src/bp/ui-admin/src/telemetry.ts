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

const endpoint = 'https://telemetry.botpress.dev'

function toHash(content: string) {
  return createHash('sha256')
    .update(content)
    .digest('hex')
}

const info = {
  bp_license: '',
  bp_release: '',
  email: ''
}

const serverUrl = '/admin/telemetry'

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
  source: string
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

export async function sendServerPackage() {
  try {
    const packages = (await api.getSecured().get(serverUrl)).data

    console.log('packages got', packages)

    const feedback = { events: [], status: '' }

    if ((packages !== undefined && _.has(packages, 'url'), _.has(packages, 'events'))) {
      const url = packages.url
      const events = packages.events

      let i = 0
      for (const obj of events) {
        if (typeof obj === 'string') {
          events[i] = JSON.parse(obj)
        }
        i++
      }

      events.map(obj => (obj.source = 'client'))

      console.log(events)

      feedback.events = events.map(obj => obj.uuid)

      try {
        await axios.post(url, events, corsConfig)
        feedback['status'] = 'ok'
        console.log('packages sent', events)
      } catch (err) {
        feedback['status'] = 'fail'
        console.log('Could not send the telemetry packages to the storage server', err)
      }
    }

    await api
      .getSecured()
      .post(serverUrl, feedback)
      .then(res => console.log('feedbacks sent', res, feedback))
      .catch(err => console.log('Could not send the feedbacks to the botpress server', err))
  } catch (err) {
    console.log('Could not access the botpress server', err)
  }
}

export function setupServerPackageLoop() {
  sendServerPackage().catch()
  setInterval(async () => await sendServerPackage(), ms('1h'))
}

export async function startTelemetry(event_type: string, data: dataType, name: string = 'data') {
  await sendTelemetry(getTelemetryPackage(event_type, data, name), event_type)
}

export function setupTelemetry() {
  setupEventsType()

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
      eventsType.forEach(event => {
        if (!locks[event]) {
          changeLock(event)
          console.log('info to send')
          const data = {
            user: {
              email: toHash(info.email),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            language: shared.lang.getLocale()
          }

          startTelemetry(event, data).catch(err => {
            console.log(err)
          })
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
    source: 'client',
    event_data: getDataCluster(data)
  }
}

async function sendTelemetry(data: TelemetryPackage, event: string) {
  const res = await axios.post(endpoint, data, corsConfig)
  console.log('info sent', res)
  addTimeout(event, ms('8h'))
}
