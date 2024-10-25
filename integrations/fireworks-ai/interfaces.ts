import * as common from '@botpress/common'
import * as path from 'path'

const { runCommand } = common.cmd
const llmPath = path.resolve(path.join('..', '..', 'interfaces', 'llm'))
const sttPath = path.resolve(path.join('..', '..', 'interfaces', 'speech-to-text'))
runCommand(`pnpm exec bp add ${llmPath} -y`, { workDir: __dirname })
runCommand(`pnpm exec bp add ${sttPath} -y`, { workDir: __dirname })
