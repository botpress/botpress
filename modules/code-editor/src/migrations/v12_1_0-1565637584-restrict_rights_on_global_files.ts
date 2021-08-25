import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const isMigrationAlreadyDone = (rules: any[]) => {
  const resources: string[] = rules.map(r => r.res)
  const alreadySpecifiedPermission = resources.find(r => r.startsWith('module.code-editor.global'))
  return !!alreadySpecifiedPermission
}

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Restrict read/write permissions on global and config files',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const ghost = bp.ghost.forGlobal()

    let enableGlobal = false
    let enableConfig = false
    if (await ghost.fileExists('config', 'code-editor.json')) {
      const currentConfig = await ghost.readFileAsObject<any>('config', 'code-editor.json')
      const newConfig = _.omit(currentConfig, 'allowGlobal', 'includeBotConfig')
      await ghost.upsertFile('config', 'code-editor.json', JSON.stringify(newConfig, undefined, 2))
      const { allowGlobal, includeBotConfig } = currentConfig
      enableGlobal = !!allowGlobal
      enableConfig = !!includeBotConfig
    }

    if (!(await ghost.fileExists('/', 'workspaces.json'))) {
      return { success: true }
    }

    const newRules = [
      {
        res: 'module.code-editor.global.*',
        op: enableGlobal ? '+r+w' : '-r-w'
      },
      {
        res: 'module.code-editor.bot.configs',
        op: enableConfig ? '+r+w' : '-r-w'
      },
      {
        res: 'module.code-editor.global.configs',
        op: '-r-w'
      }
    ]

    const workspaces: any[] = await ghost.readFileAsObject('/', 'workspaces.json')
    try {
      for (const ws of workspaces) {
        const { roles } = ws

        for (const role of roles) {
          if (isMigrationAlreadyDone(role.rules)) {
            return { success: true, message: 'Rules are already updated, skipping...' }
          }
          role.rules.push(...newRules)
        }
      }
    } catch (err) {
      return { success: false, message: 'workspaces.json has invalid format' }
    }

    await ghost.upsertFile('/', 'workspaces.json', JSON.stringify(workspaces, undefined, 2))
    return { success: true }
  }
}

export default migration
