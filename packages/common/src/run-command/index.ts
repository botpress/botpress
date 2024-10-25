import * as childprocess from 'child_process'

export type RunCommandOptions = {
  workDir: string
}

export type RunCommandOutput = {
  exitCode: number
}

export const runCommand = (cmd: string, { workDir }: RunCommandOptions): RunCommandOutput => {
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
