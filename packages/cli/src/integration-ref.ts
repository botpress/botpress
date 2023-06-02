import semver from 'semver'
import * as uuid from 'uuid'

export type UUIDIntegrationRef = {
  type: 'id'
  id: string
}

export type NameIntegrationRef = {
  type: 'name'
  name: string
  version: string
}

export type IntegrationRef = UUIDIntegrationRef | NameIntegrationRef

const LATEST_TAG = 'latest'

export const formatIntegrationRef = (ref: IntegrationRef): string => {
  if (ref.type === 'id') {
    return ref.id
  }
  return `${ref.name}@${ref.version}`
}

export const parseIntegrationRef = (ref: string): IntegrationRef | undefined => {
  if (uuid.validate(ref)) {
    return { type: 'id', id: ref }
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
