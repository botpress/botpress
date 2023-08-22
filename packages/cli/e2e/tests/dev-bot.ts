import findProcess from 'find-process'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import defaults from '../defaults'
import { Test } from '../typings'
import * as utils from '../utils'

const handleExitCode = ({ exitCode }: { exitCode: number }) => {
  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}`)
  }
}

const PORT = 8075

export const devBot: Test = {
  name: 'cli should allow creating and running a bot locally',
  handler: async ({ tmpDir, tunnelUrl, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'bots')
    const botName = uuid.v4()
    const botDir = pathlib.join(baseDir, botName)

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    await impl.init({ ...argv, workDir: baseDir, name: botName, type: 'bot' }).then(handleExitCode)
    await utils.fixBotpressDependencies({ workDir: botDir, target: dependencies })
    await utils.npmInstall({ workDir: botDir }).then(handleExitCode)
    await impl.login({ ...argv }).then(handleExitCode)

    const cmdPromise = impl.dev({ ...argv, workDir: botDir, port: PORT, tunnelUrl }).then(handleExitCode)
    await utils.sleep(5000)

    const allProcess = await findProcess('port', PORT)

    const [botProcess] = allProcess
    if (allProcess.length > 1) {
      throw new Error(`Expected to find only one process listening on port ${PORT}`)
    }
    if (!botProcess) {
      throw new Error(`Expected to find a process listening on port ${PORT}`)
    }

    /**
     * TODO:
     * - try calling the Bot locally to see if it works
     * - allow listing dev bots in API and find the one we just created (by name)
     */

    process.kill(botProcess.pid)
    await cmdPromise
  },
}
