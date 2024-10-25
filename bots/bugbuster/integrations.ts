import * as childprocess from 'child_process'
import * as path from 'path'

type RunCommandOptions = {
  workDir: string
}

type RunCommandOutput = {
  exitCode: number
}
const runCommand = (cmd: string, { workDir }: RunCommandOptions): RunCommandOutput => {
  const [program, ...args] = cmd.split(' ')
  if (!program) {
    throw new Error('Cannot run empty command')
  }
  const { error, status } = childprocess.spawnSync(program, args, {
    cwd: workDir,
    stdio: 'inherit',
  })
  if (error) {
    throw error
  }
  return { exitCode: status ?? 0 }
}

const integrationNames: string[] = ['github', 'slack']
for (const integrationName of integrationNames) {
  const integrationPath = path.resolve(path.join('..', '..', 'integrations', integrationName))
  runCommand(`bp add ${integrationPath} -y`, { workDir: __dirname })
}
