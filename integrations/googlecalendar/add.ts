import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const interfaceNames: string[] = ['creatable', 'deletable', 'listable', 'readable', 'updatable']

for (const interfaceName of interfaceNames) {
  const interfacePath = path.resolve(path.join('..', '..', 'interfaces', interfaceName))
  runCommand(`pnpm exec bp add ${interfacePath} -y`, { workDir: __dirname })
}
