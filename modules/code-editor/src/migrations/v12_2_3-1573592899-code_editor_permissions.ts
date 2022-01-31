import * as sdk from 'botpress/sdk'

const filename = 'workspaces.json'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Update workspaces.json with new rules for module code-editor',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const workspaces: any[] = await bp.ghost.forGlobal().readFileAsObject('/', filename)
    let hasChanges = false

    for (const workspace of workspaces) {
      workspace.roles.forEach(role => {
        const globalRule = role.rules.find(x => x.res === 'module.code-editor.global.configs')
        if (globalRule) {
          hasChanges = true
          globalRule.res = 'module.code-editor.global.main_config'

          // Since configs were split, add the same config for modules
          role.rules.push({ res: 'module.code-editor.global.module_config', op: globalRule.op })
        }

        const botRule = role.rules.find(x => x.res === 'module.code-editor.bot.configs')
        if (botRule) {
          hasChanges = true
          botRule.res = 'module.code-editor.bot.bot_config'
        }
      })
    }

    if (hasChanges) {
      await bp.ghost.forGlobal().upsertFile('/', filename, JSON.stringify(workspaces, undefined, 2))
      return { success: true, message: 'Configuration updated successfully' }
    }

    return { success: true, message: 'No changes were made to the configuration' }
  }
}

export default migration
