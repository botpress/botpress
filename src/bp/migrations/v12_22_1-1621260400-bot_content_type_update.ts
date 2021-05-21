import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds file and location content types to bot configs',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()
    const newTypes = ['builtin_file', 'builtin_location']
    let hasChanges = false

    for (const [botId, botConfig] of bots) {
      const { contentTypes } = botConfig.imports

      const hasMissingTypes = !newTypes.every(type => contentTypes.find(x => x === type))

      if (hasMissingTypes) {
        hasChanges = true
        botConfig.imports.contentTypes = _.uniq([...contentTypes, ...newTypes])

        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    return { success: true, message: hasChanges ? 'New types added successfully' : 'Nothing to change' }
  },
  down: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()
    const typesToRemove = ['builtin_file', 'builtin_location']
    let hasChanges = false

    for (const [botId, botConfig] of bots) {
      const { contentTypes } = botConfig.imports

      const hasTypes = !typesToRemove.every(type => contentTypes.find(x => x === type))

      if (hasTypes) {
        hasChanges = true
        botConfig.imports.contentTypes = _.differenceWith(contentTypes, typesToRemove, _.isEqual)

        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    return { success: true, message: hasChanges ? 'Types successfully removed' : 'Nothing to change' }
  }
}

export default migration
