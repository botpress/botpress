import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const failureMigration: sdk.MigrationResult = { success: false, message: 'workspaces.json has invalid format' }

const isMigrationAlreadyDone = (rules: any[]) => {
  const ressources: string[] = rules.map(r => r.res)
  const alreadySpecifiedPermission = ressources.find(r => r.startsWith('module.code-editor.global'))
  return !!alreadySpecifiedPermission
}

const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const ghost = bp.ghost.forGlobal()

    if (!ghost.fileExists('config', 'code-editor.json')) {
      return failureMigration
    }

    const currentConfig = await ghost.readFileAsObject<any>('config', 'code-editor.json')
    const newConfig = _.omit(currentConfig, 'allowGlobal', 'includeBotConfig')
    await ghost.upsertFile('config', 'code-editor.json', JSON.stringify(newConfig, null, 2))
    const { allowGlobal, includeBotConfig } = currentConfig

    const newRules = [
      {
        res: 'module.code-editor.global.*',
        op: allowGlobal ? '+r+w' : '-r-w'
      },
      {
        res: 'module.code-editor.bot.configs',
        op: includeBotConfig ? '+r+w' : '-r-w'
      },
      {
        res: 'module.code-editor.global.configs',
        op: '-r-w'
      }
    ]

    const workspaces: any[] = await ghost.readFileAsObject('/', `workspaces.json`)
    if (!_.isArray(workspaces)) {
      return failureMigration
    }

    for (const ws of workspaces) {
      const { roles } = ws

      if (!_.isArray(roles)) {
        return failureMigration
      }

      for (const role of roles) {
        if (role && _.isArray(role.rules)) {
          if (isMigrationAlreadyDone(role.rules)) {
            return { success: true, message: 'no-need for migration' }
          }
          role.rules.push(...newRules)
        }
      }
    }

    await ghost.upsertFile('/', 'workspaces.json', JSON.stringify(workspaces, undefined, 2))

    return { success: true }
  }
}

export default migration
