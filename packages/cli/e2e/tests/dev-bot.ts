import { Client, isApiError } from '@botpress/client'
import axios from 'axios'
import findProcess from 'find-process'
import fslib from 'fs'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

const handleExitCode = ({ exitCode }: { exitCode: number }) => {
  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}`)
  }
}

const fetchDevBot = async (client: Client, id: string) => {
  const { bot } = await client.getBot({ id }).catch((err) => {
    if (isApiError(err) && err.type === 'ResourceNotFound') {
      return { bot: undefined }
    }
    throw err
  })
  return bot
}

const readBotCache = async (
  botDir: string
): Promise<{
  botId?: string
  tunnelId?: string
  devId?: string
}> => {
  const botCache = pathlib.join(botDir, '.botpress', 'project.cache.json')
  if (!fslib.existsSync(botCache)) {
    return {}
  }
  const cacheContent: string = await fslib.promises.readFile(botCache, 'utf-8')
  try {
    return JSON.parse(cacheContent)
  } catch {
    return {}
  }
}

const PORT = 8075

export const devBot: Test = {
  name: 'cli should allow creating and running a bot locally',
  handler: async ({ tmpDir, tunnelUrl, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'bots')
    const botName = uuid.v4()
    const tunnelId = uuid.v4()
    const botDir = pathlib.join(baseDir, botName)

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    const client = new Client({
      apiUrl: creds.apiUrl,
      token: creds.token,
      workspaceId: creds.workspaceId,
      retry: retry.config,
    })

    await impl.init({ ...argv, workDir: baseDir, name: botName, type: 'bot', template: 'empty' }).then(handleExitCode)
    await utils.fixBotpressDependencies({ workDir: botDir, target: dependencies })
    await utils.npmInstall({ workDir: botDir }).then(handleExitCode)
    await impl.login({ ...argv }).then(handleExitCode)

    const cmdPromise = impl
      .dev({ ...argv, workDir: botDir, port: PORT, tunnelUrl, tunnelId, noSecretCaching: true })
      .then(handleExitCode)
    await utils.sleep(5000)

    const allProcess = await findProcess('port', PORT)
    const [botProcess] = allProcess
    if (allProcess.length > 1) {
      throw new Error(`Expected to find only one process listening on port ${PORT}`)
    }
    if (!botProcess) {
      throw new Error(`Expected to find a process listening on port ${PORT}`)
    }

    const botCache = await readBotCache(botDir)
    const { devId: botId } = botCache
    if (!botId) {
      throw new Error('Expected devId to be set in project cache')
    }

    const resp = await axios.get(`http://localhost:${PORT}/health`)
    if (resp.status !== 200) {
      throw new Error(`Expected health endpoint to return 200, got ${resp.status}`)
    }

    process.kill(botProcess.pid)
    await cmdPromise

    const apiBot = await fetchDevBot(client, botId)
    if (!apiBot) {
      throw new Error(`Dev Bot ${botId} should have been created in the backend`)
    }

    await impl.bots.delete({ ...argv, botRef: apiBot.id }).then(utils.handleExitCode)

    if (await fetchDevBot(client, botId)) {
      throw new Error(`Dev bot ${botId} should have been deleted`)
    }
  },
}
