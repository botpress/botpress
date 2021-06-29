import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
