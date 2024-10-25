import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const integrationNames: string[] = ['gsheets', 'telegram']
for (const integrationName of integrationNames) {
  const integrationPath = path.resolve(path.join('..', '..', 'integrations', integrationName))
  runCommand(`bp add ${integrationPath} -y`, { workDir: __dirname })
}
