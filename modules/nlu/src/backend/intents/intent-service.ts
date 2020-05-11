import * as sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'

import { EntityService } from '../typings'

const INTENTS_DIR = './intents'

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[\t\s]/gi, '-')
}

function intentExists(ghost: sdk.ScopedGhostService, intentName: string): Promise<boolean> {
  return ghost.fileExists(INTENTS_DIR, `${intentName}.json`)
}

export async function getIntents(ghost: sdk.ScopedGhostService): Promise<sdk.NLU.IntentDefinition[]> {
  const intentNames = await ghost.directoryListing(INTENTS_DIR, '*.json')
  return Promise.mapSeries(intentNames, n => getIntent(ghost, n))
}

export async function getIntent(ghost: sdk.ScopedGhostService, intentName: string): Promise<sdk.NLU.IntentDefinition> {
  intentName = sanitizeFileName(intentName)
  if (intentName.length < 1) {
    throw new Error('Invalid intent name, expected at least one character')
  }

  if (!(await intentExists(ghost, intentName))) {
    throw new Error('Intent does not exist')
  }
  return ghost.readFileAsObject(INTENTS_DIR, `${intentName}.json`)
}

export async function saveIntent(
  ghost: sdk.ScopedGhostService,
  intent: sdk.NLU.IntentDefinition,
  entityService: EntityService
): Promise<sdk.NLU.IntentDefinition> {
  const name = sanitizeFileName(intent.name)
  if (name.length < 1) {
    throw new Error('Invalid intent name, expected at least one character')
  }

  const availableEntities = await entityService.getEntities()

  _.chain(intent.slots)
    .flatMap('entities')
    .uniq()
    .forEach(entity => {
      if (!availableEntities.find(e => e.name === entity)) {
        throw Error(`"${entity}" is neither a system entity nor a custom entity`)
      }
    })

  await ghost.upsertFile(INTENTS_DIR, `${name}.json`, JSON.stringify(intent, undefined, 2))
  return intent
}

export async function updateIntent(
  ghost: sdk.ScopedGhostService,
  name: string,
  content: Partial<sdk.NLU.IntentDefinition>,
  entityService: EntityService
): Promise<sdk.NLU.IntentDefinition> {
  const intentDef = await getIntent(ghost, name)
  const merged = _.merge(intentDef, content) as sdk.NLU.IntentDefinition
  if (content?.name !== name) {
    await deleteIntent(ghost, name)
    name = content.name
  }
  return saveIntent(ghost, merged, entityService)
}

export async function deleteIntent(ghost: sdk.ScopedGhostService, intentName: string): Promise<void> {
  intentName = sanitizeFileName(intentName)

  if (!(await intentExists(ghost, intentName))) {
    throw new Error('Intent does not exist')
  }

  return ghost.deleteFile(INTENTS_DIR, `${intentName}.json`)
}

// ideally this would be a filewatcher
export async function updateIntentsSlotsEntities(
  ghost: sdk.ScopedGhostService,
  prevEntityName: string,
  newEntityName: string,
  entityService: EntityService
): Promise<void> {
  _.each(await getIntents(ghost), async intent => {
    let modified = false
    _.each(intent.slots, slot => {
      _.forEach(slot.entities, (e, index, arr) => {
        if (e === prevEntityName) {
          arr[index] = newEntityName
          modified = true
        }
      })
    })
    if (modified) {
      await updateIntent(ghost, intent.name, intent, entityService)
    }
  })
}

/**
 * This method read every workflow to extract their intent usage, so they can be in sync with their topics.
 * The list of intent names is not required, but it saves some processing
 */
export async function updateContextsFromTopics(
  ghost: sdk.ScopedGhostService,
  entityService: EntityService,
  intentNames?: string[]
): Promise<void> {
  const flowsPaths = await ghost.directoryListing('flows', '*.flow.json')
  const flows: sdk.Flow[] = await Promise.map(flowsPaths, async (flowPath: string) => ({
    name: flowPath,
    ...(await ghost.readFileAsObject<FlowView>('flows', flowPath))
  }))

  const intents: { [intentName: string]: string[] } = {}

  for (const flow of flows) {
    const topicName = flow.name.split('/')[0]

    for (const node of flow.nodes.filter(x => x.type === 'trigger')) {
      const tn = node as sdk.TriggerNode
      const match = tn.conditions.find(x => x.id === 'user_intent_is')
      const name = match?.params?.intentName

      if (name && name !== 'none' && (!intentNames || intentNames.includes(name))) {
        intents[name] = _.uniq([...(intents[name] || []), topicName])
      }
    }
  }

  for (const intentName of Object.keys(intents)) {
    const intentDef = await getIntent(ghost, intentName)

    if (!_.isEqual(intentDef.contexts.sort(), intents[intentName].sort())) {
      intentDef.contexts = intents[intentName]
      await saveIntent(ghost, intentDef, entityService)
    }
  }
}
