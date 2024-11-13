import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const integrationNames: string[] = ['whatsapp', 'webhook']
for (const integrationName of integrationNames) {
  const integrationPath = path.resolve(path.join('..', '..', 'integrations', integrationName))
  runCommand(`pnpm exec bp add ${integrationPath} -y`, { workDir: __dirname })
}

const pluginNames: string[] = ['logger']
for (const pluginName of pluginNames) {
  const pluginPath = path.resolve(path.join('..', '..', 'plugins', pluginName))
  runCommand(`pnpm exec bp add ${pluginPath} -y`, { workDir: __dirname })
}
