import * as sdk from 'botpress/sdk'

export type RenameListener = (botId: string, oldName: string, newName: string) => Promise<void>

export interface FileSystem {
  forBot(botId: string): sdk.ScopedGhostService
}

export interface EntityRepository {
  listenForEntityRename(l: RenameListener): void
  getCustomEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]>
  getEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]>
  getEntity(botId: string, entityName: string): Promise<sdk.NLU.EntityDefinition>
  deleteEntity(botId: string, entityName: string): Promise<void>
  saveEntity(botId: string, entity: sdk.NLU.EntityDefinition): Promise<void>
  updateEntity(botId: string, targetEntityName: string, entity: sdk.NLU.EntityDefinition): Promise<void>
}

export interface IntentRepository {
  getIntents(botId: string): Promise<sdk.NLU.IntentDefinition[]>
  getIntent(botId: string, intentName: string): Promise<sdk.NLU.IntentDefinition>
  saveIntent(botId: string, intent: sdk.NLU.IntentDefinition): Promise<sdk.NLU.IntentDefinition>
  updateIntent(
    botId: string,
    name: string,
    content: Partial<sdk.NLU.IntentDefinition>
  ): Promise<sdk.NLU.IntentDefinition>
  deleteIntent(botId: string, intentName: string): Promise<void>
  updateIntentsSlotsEntities(botId: string, prevEntityName: string, newEntityName: string): Promise<void>
  updateContextsFromTopics(botId: string, intentNames?: string[]): Promise<void>
}

export const makeDefinitionsRepositories: (
  ghost: FileSystem
) => {
  entityRepo: EntityRepository
  intentRepo: IntentRepository
}
