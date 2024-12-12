import { Client } from '@botpress/client'
import fslib from 'fs'
import pathlib from 'path'

const getEnv = (envName: string): string => {
  const envValue = process.env[envName]
  if (!envValue) {
    throw new Error(`${envName} is required`)
  }
  return envValue
}

const apiUrl = getEnv('BP_API_URL')
const token = getEnv('BP_TOKEN')
const workspaceId = getEnv('BP_WORKSPACE_ID')

const integrationPath = getEnv('CHAT_PATH')
const botPath = getEnv('ECHO_PATH')

const readDevId = async (path: string): Promise<string> => {
  const cachePath = pathlib.join(path, '.botpress', 'project.cache.json')
  const cacheContent = await fslib.promises.readFile(cachePath, 'utf-8')
  const cache = JSON.parse(cacheContent)
  const { devId } = cache
  if (!devId) {
    throw new Error(`devId not found at "${cachePath}"`)
  }
  return devId
}

const main = async () => {
  const client = new Client({
    apiUrl,
    token,
    workspaceId,
  })

  const chatDevId = await readDevId(integrationPath)
  const echoDevId = await readDevId(botPath)

  const { bot } = await client.getBot({ id: echoDevId })

  const chatIntegrationInstance = bot.integrations[chatDevId]
  if (!chatIntegrationInstance) {
    throw new Error(`Chat integration with dev id "${chatDevId}" not installed in bot "${echoDevId}"`)
  }

  console.info(chatIntegrationInstance.webhookId)
}

void main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
