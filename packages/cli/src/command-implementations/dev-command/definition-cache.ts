import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as errors from '../../errors'
import { ProjectDefinition } from '../project-command'

const BOT_DEFINITION_PATH = 'bot.definition.ts'
const INTEGRATION_DEFINITION_PATH = 'integration.definition.ts'

export class DefinitionCache {
  private _cachedHash: string | undefined = undefined

  public async didDefinitionsChange(definition: ProjectDefinition) {
    const hash = await this._computeDefinitionHash(definition)
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

  private async _computeDefinitionHash(project: ProjectDefinition): Promise<string | null> {
    if (!['integration', 'bot'].includes(project.type)) {
      throw new errors.BotpressCLIError(`DefinitionCache not supported for definition type: ${project.type}`)
    }
    const paths = this._fileToWatch(project)

    const hash = crypto.createHash('sha256')
    let didUpdateHash = false
    for (const path of paths) {
      await fs
        .readFile(path)
        .then((content) => {
          hash.update(content)
          didUpdateHash = true
        })
        .catch(() => {})
    }

    return didUpdateHash ? hash.digest('hex') : null
  }

  private _fileToWatch(project: ProjectDefinition): string[] {
    const paths = []
    if (project.type === 'bot') {
      paths.push(BOT_DEFINITION_PATH)
    } else if (project.type === 'integration') {
      paths.push(INTEGRATION_DEFINITION_PATH)
      paths.push(project.definition.identifier?.extractScript)
      paths.push(project.definition.identifier?.fallbackHandlerScript)
      paths.push(project.definition.configuration?.identifier?.linkTemplateScript)
    }
    return paths.filter((path): path is string => path !== undefined)
  }
}
