import semver from 'semver'
import * as utils from './utils'

export type UUIDIntegrationRef = {
  type: 'id'
  id: string
}

export type NameIntegrationRef = {
  type: 'name'
  name: string
  version: string
}

export type LocalPathIntegrationRef = {
  type: 'path'
  path: utils.path.AbsolutePath
}

export type ApiIntegrationRef = UUIDIntegrationRef | NameIntegrationRef
export type IntegrationRef = ApiIntegrationRef | LocalPathIntegrationRef

const LATEST_TAG = 'latest'

export const formatIntegrationRef = (ref: IntegrationRef): string => {
  if (ref.type === 'path') {
    return ref.path
  }
  if (ref.type === 'id') {
    return ref.id
  }
  return `${ref.name}@${ref.version}`
}

export const parseIntegrationRef = (ref: string): IntegrationRef | undefined => {
  if (!ref) {
    return
  }

  if (utils.id.isValidID(ref)) {
    return { type: 'id', id: ref }
  }

  if (utils.path.isAbsolute(ref)) {
    return { type: 'path', path: ref }
  }

  if (!ref.includes('@')) {
    return { type: 'name', name: ref, version: LATEST_TAG }
  }

  const [name, version] = ref.split('@')
  if (!name || !version) {
    return
  }

  const cleanedVersion = version === LATEST_TAG ? version : semver.clean(version)
  if (!cleanedVersion) {
    return
  }

  return { type: 'name', name, version: cleanedVersion }
}
