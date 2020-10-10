import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ILegacyIntentService, LegacyIntentDefinition, NewLegacyIntentDefinition } from '../typings'

const LEGACY_INTENT_DIR = 'intents'

export class LegacyIntentService implements ILegacyIntentService {
  private _ghost: sdk.ScopedGhostService

  constructor(private bp: typeof sdk, private botId: string) {
    this._ghost = this.bp.ghost.forBot(this.botId)
  }

  public async getIntents(): Promise<LegacyIntentDefinition[]> {
    const intentFiles = await this._ghost.directoryListing(LEGACY_INTENT_DIR, '*.json')
    const legacyIntents = await Promise.map(intentFiles, file =>
      this._ghost.readFileAsObject<LegacyIntentDefinition>(LEGACY_INTENT_DIR, file)
    )
    return legacyIntents
  }

  public async getContexts(): Promise<string[]> {
    const intents = await this.getIntents()
    const contexts = _.flatMap(intents, i => i.contexts)
    return _.uniq(contexts)
  }

  public async createIntent(newIntent: NewLegacyIntentDefinition): Promise<void> {
    const filename = this._makeFileName(newIntent.name)
    const intent: LegacyIntentDefinition = { ...newIntent, filename }
    return this._ghost.upsertFile(LEGACY_INTENT_DIR, filename, JSON.stringify(intent, undefined, 2))
  }

  public async updateIntent(name: string, intent: LegacyIntentDefinition): Promise<void> {
    const isRename = name !== intent.name
    if (isRename) {
      await this._ghost.deleteFile(LEGACY_INTENT_DIR, this._makeFileName(intent.name))
    }
    return this.createIntent(intent)
  }

  public async deleteIntent(intent: string): Promise<void> {
    return this._ghost.deleteFile(LEGACY_INTENT_DIR, this._makeFileName(intent))
  }

  private _makeFileName(intent: string) {
    return `${intent}.json`
  }
}
