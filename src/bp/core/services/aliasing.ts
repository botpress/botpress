import * as sdk from 'botpress/sdk'
import { KeyValueStore } from 'core/kvs'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

@injectable()
export class AliasingService {
  private contexts: { [context: string]: ScopedAliasing } = {}

  constructor(@inject(TYPES.KeyValueStore) private kvsService: KeyValueStore) {}

  public forScope(context: string): ScopedAliasing {
    let repo = this.contexts[context]
    if (!repo) {
      repo = new ScopedAliasing(context, this.kvsService.global())
      this.contexts[context] = repo
    }
    return repo
  }
}

export class ScopedAliasing implements sdk.aliasing.AliasingContext {
  constructor(private scope: string, private kvs: sdk.KvsService) {}

  async make(localId: string, foreignId: string): Promise<void> {
    await this.kvs.set(this.getForeignMapKey(foreignId), localId)
    await this.kvs.set(this.getLocalMapKey(localId), foreignId)
  }

  async unmake(localId: string, foreignId: string): Promise<void> {
    await this.kvs.delete(this.getForeignMapKey(foreignId))
    await this.kvs.delete(this.getLocalMapKey(localId))
  }

  async getForeign(foreignId: string): Promise<string> {
    return this.kvs.get(this.getForeignMapKey(foreignId))
  }

  async getLocal(localId: string): Promise<string> {
    return this.kvs.get(this.getLocalMapKey(localId))
  }

  private getForeignMapKey(foreignId: string) {
    return `aliasmap-foreign/${this.scope}/${foreignId}`
  }
  private getLocalMapKey(localId: string) {
    return `aliasmap-local/${this.scope}/${localId}`
  }
}
