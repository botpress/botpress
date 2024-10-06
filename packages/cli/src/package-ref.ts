import semver from 'semver'
import * as utils from './utils'

export type UUIDPackageRef = {
  type: 'id'
  id: string
}

export type NamePackageRef = {
  type: 'name'
  name: string
  version: string
}

export type LocalPackageRef = {
  type: 'path'
  path: string
}

export type ApiPackageRef = UUIDPackageRef | NamePackageRef
export type PackageRef = ApiPackageRef | LocalPackageRef

const LATEST_TAG = 'latest'

export const formatPackageRef = (ref: PackageRef): string => {
  if (ref.type === 'path') {
    return ref.path
  }
  if (ref.type === 'id') {
    return ref.id
  }
  return `${ref.name}@${ref.version}`
}

export const parsePackageRef = (ref: string): PackageRef | undefined => {
  if (!ref) {
    return
  }

  if (utils.id.isValidID(ref)) {
    return { type: 'id', id: ref }
  }

  if (utils.path.isPath(ref)) {
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
