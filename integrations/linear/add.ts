import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const listablePath = path.resolve(path.join('..', '..', 'interfaces', 'listable'))
runCommand(`pnpm exec bp add ${listablePath} -y`, { workDir: __dirname })
