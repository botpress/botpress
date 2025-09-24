import * as crypto from 'crypto'
import * as fs from 'fs/promises'

export const DEFINITION_CACHE_BOT = ['bot.definition.ts']
export const DEFINITION_CACHE_INTEGRATION = ['integration.definition.ts']

export class DefinitionCache {
  private _cachedHash: string | undefined = undefined

  public async didDefinitionChanged(_files: string[]) {
    const hash = await this._computeFilesHash(_files)
    if (hash === null) {
      return true
    }
    if (this._cachedHash !== hash) {
      this._cachedHash = hash
      return true
    }
    this._cachedHash = hash
    return false
  }

  private _computeFilesHash = async (filePaths: string[]): Promise<string | null> => {
    const hash = crypto.createHash('sha256')
    let didConsumeAFile = false
    for (const path of filePaths) {
      await fs
        .readFile(path)
        .then((content) => {
          hash.update(content)
          didConsumeAFile = true
        })
        .catch(() => {})
    }
    return didConsumeAFile ? hash.digest('hex') : null
  }
}
