import * as sdk from '@botpress/sdk'
import semver from 'semver'
import * as utils from './utils'

type PackageType = sdk.Package['type']
const packageTypes: Record<PackageType, null> = {
  integration: null,
  interface: null,
  plugin: null,
}
const isPackageType = (type: string): type is PackageType => type in packageTypes

export type UUIDPackageRef = {
  type: 'id'
  id: string
}

export type NamePackageRef = {
  type: 'name'
  pkg?: PackageType
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

export const isLatest = (ref: NamePackageRef): boolean => ref.version === LATEST_TAG

export const formatPackageRef = (ref: PackageRef): string => {
  if (ref.type === 'path') {
    return ref.path
  }
  if (ref.type === 'id') {
    return ref.id
  }
  if (ref.pkg) {
    return `${ref.pkg}:${ref.name}@${ref.version}`
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

  return parseNamePackageRef(ref)
}

const parseNamePackageRef = (ref: string): NamePackageRef | undefined => {
  if (!ref) {
    return
  }

  if (ref.includes(':')) {
    const [pkg, nameVersion] = ref.split(':')
    if (!pkg || !nameVersion) {
      return
    }
    if (!isPackageType(pkg)) {
      return
    }
    const parsed = parseNamePackageRef(nameVersion)
    if (!parsed) {
      return
    }
    return { ...parsed, pkg }
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
