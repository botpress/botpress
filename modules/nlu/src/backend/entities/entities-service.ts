import * as sdk from 'botpress/sdk'

import { updateIntentsSlotsEntities } from '../intents/intent-service'

import { DucklingEntityExtractor } from './duckling_extractor'

const ENTITIES_DIR = './entities'

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[\t\s]/gi, '-')
}

function entityExists(ghost: sdk.ScopedGhostService, entityName: string): Promise<boolean> {
  return ghost.fileExists(ENTITIES_DIR, `${entityName}.json`)
}

export function getSystemEntities(): sdk.NLU.EntityDefinition[] {
  return [...DucklingEntityExtractor.entityTypes, 'any'].map(e => ({
    name: e,
    type: 'system'
  })) as sdk.NLU.EntityDefinition[]
}

export async function getCustomEntities(ghost: sdk.ScopedGhostService): Promise<sdk.NLU.EntityDefinition[]> {
  const intentNames = await ghost.directoryListing(ENTITIES_DIR, '*.json')
  return Promise.mapSeries(intentNames, n => getEntity(ghost, n))
}

export async function getEntities(ghost: sdk.ScopedGhostService): Promise<sdk.NLU.EntityDefinition[]> {
  return [...getSystemEntities(), ...(await getCustomEntities(ghost))]
}

export async function getEntity(ghost: sdk.ScopedGhostService, entityName: string): Promise<sdk.NLU.EntityDefinition> {
  entityName = sanitizeFileName(entityName)

  if (!(await entityExists(ghost, entityName))) {
    throw new Error('Entity does not exist')
  }
  return ghost.readFileAsObject(ENTITIES_DIR, `${entityName}.json`)
}

export async function deleteEntity(ghost: sdk.ScopedGhostService, entityName: string): Promise<void> {
  const nameSanitized = sanitizeFileName(entityName)
  if (!(await entityExists(ghost, nameSanitized))) {
    throw new Error('Entity does not exist')
  }

  return ghost.deleteFile(ENTITIES_DIR, `${nameSanitized}.json`)
}

export async function saveEntity(ghost: sdk.ScopedGhostService, entity: sdk.NLU.EntityDefinition): Promise<void> {
  const nameSanitized = sanitizeFileName(entity.name)
  return ghost.upsertFile(ENTITIES_DIR, `${nameSanitized}.json`, JSON.stringify(entity, undefined, 2))
}

export async function updateEntity(
  ghost: sdk.ScopedGhostService,
  targetEntityName: string,
  entity: sdk.NLU.EntityDefinition
): Promise<void> {
  const nameSanitized = sanitizeFileName(entity.name)
  const targetSanitized = sanitizeFileName(targetEntityName)

  await saveEntity(ghost, entity)
  if (targetSanitized !== nameSanitized) {
    await Promise.all([
      deleteEntity(ghost, targetSanitized),
      updateIntentsSlotsEntities(ghost, targetSanitized, nameSanitized)
    ])
  }
}
