import { Client } from '@botpress/client'

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
const botId = getEnv('BP_BOT_ID')

const main = async () => {
  const client = new Client({
    apiUrl,
    token,
    workspaceId,
  })

  const { bot } = await client.getBot({ id: botId })

  const whIds: Record<string, string> = {}
  for (const integrationInstance of Object.values(bot.integrations)) {
    whIds[integrationInstance.name] = integrationInstance.webhookId
  }

  console.info(JSON.stringify(whIds))
}

void main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
