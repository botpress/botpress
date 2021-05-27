import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add nluServer config to the global NLU config file',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await bp.ghost.forGlobal().readFileAsObject<Config>('./config', 'nlu.json')

    if (!config.nluServer) {
      config.nluServer = {
        autoStart: true
      }

      bp.ghost.forGlobal().upsertFile('./config', 'nlu.json', JSON.stringify(config, null, 2))
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
