import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const interfaceNames: string[] = ['llm']
for (const integrationName of interfaceNames) {
  const integrationPath = path.resolve(path.join('..', '..', 'interfaces', integrationName))
  runCommand(`pnpm exec bp add ${integrationPath} -y`, { workDir: __dirname })
}
