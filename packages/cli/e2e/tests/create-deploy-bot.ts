import { Client } from '@botpress/client'
import childprocess from 'child_process'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import defaults from '../defaults'
import { Test } from '../typings'

type ApiBot = Awaited<ReturnType<Client['listBots']>>['bots'][0]

const npmInstall = async ({ workDir }: { workDir: string }) => {
  const { status } = childprocess.spawnSync('pnpm', ['install'], {
    cwd: workDir,
    stdio: 'inherit',
  })
  return { exitCode: status ?? 0 }
}

const fetchAllBots = async (client: Client): Promise<ApiBot[]> => {
  let allBots: ApiBot[] = []
  let nextToken: string | undefined = undefined
  do {
    const { bots, meta } = await client.listBots({ nextToken })
    allBots = allBots.concat(bots)
    nextToken = meta.nextToken
  } while (nextToken)
  return allBots
}

const fetchBot = async (client: Client, botName: string): Promise<ApiBot | undefined> => {
  const bots = await fetchAllBots(client)
  return bots.find(({ name }) => name === botName)
}

const handleExitCode = ({ exitCode }: { exitCode: number }) => {
  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}`)
  }
}

export const createDeployBot: Test = {
  name: 'cli should allow creating, building, deploying and mannaging a bot',
  handler: async ({ tmpDir, ...creds }) => {
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

    const client = new Client({ host: creds.apiUrl, token: creds.token, workspaceId: creds.workspaceId })

    await impl.init({ ...argv, workDir: baseDir, name: botName, type: 'bot' }).then(handleExitCode)
    await npmInstall({ workDir: botDir }).then(handleExitCode)
    await impl.build({ ...argv, workDir: botDir }).then(handleExitCode)
    await impl.login({ ...argv }).then(handleExitCode)
    await impl.bots.subcommands.create({ ...argv, name: botName }).then(handleExitCode)

    const bot = await fetchBot(client, botName)
    if (!bot) {
      throw new Error(`Bot ${botName} should have been created`)
    }

    await impl.deploy({ ...argv, workDir: botDir, createNewBot: false, botId: bot.id }).then(handleExitCode)
    await impl.bots.subcommands.delete({ ...argv, botRef: bot.id }).then(handleExitCode)

    if (await fetchBot(client, botName)) {
      throw new Error(`Bot ${botName} should have been deleted`)
    }
  },
}
