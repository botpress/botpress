import * as childProcess from 'child_process'

const parseCommand = (cmd: string): { command: string; args: string[] } => {
  const [command, ...args] = cmd.split(' ')
  if (!command) {
    throw new Error('Command is empty')
  }
  return {
    command,
    args,
  }
}

export const $ = (cmd: string) => {
  const { command, args } = parseCommand(cmd)
  return childProcess.spawnSync(command, args, {
    stdio: 'inherit',
  })
}
export default $
