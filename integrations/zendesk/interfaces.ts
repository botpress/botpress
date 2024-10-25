import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const hitlPath = path.resolve(path.join('..', '..', 'interfaces', 'hitl'))
runCommand(`bp add ${hitlPath} -y`, { workDir: __dirname })
