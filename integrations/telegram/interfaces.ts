import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const typingIndicatorPath = path.resolve(path.join('..', '..', 'interfaces', 'typing-indicator'))
runCommand(`pnpm exec bp add ${typingIndicatorPath} -y`, { workDir: __dirname })
