import 'dotenv/config'
import { Client } from '@botpress/client'
import { z } from '@botpress/sdk'
import axios from 'axios'
import { parseArgs } from 'node:util'

const argsSchema = z.object({
  apiUrl: z.string(),
  workspaceId: z.string(),
  token: z.string(),
  instagramRefreshToken: z.string(),
  json: z.boolean(),
  useProvidedToken: z.boolean(),
})
type RefreshSecretArgs = {
  instagramRefreshToken: string
  client: Client
  json: boolean
  useProvidedToken: boolean
  log: (message: string) => void
}

const INTEGRATION_SECRET_SANDBOX_ACCESS_TOKEN = 'SANDBOX_ACCESS_TOKEN'
const DEFAULT_API_URL = 'https://api.botpress.cloud'
const INSTAGRAM_GRAPH_API_URL = 'https://graph.instagram.com'

async function refreshSandboxAccessToken(args: RefreshSecretArgs) {
  const { instagramRefreshToken, client, useProvidedToken, log } = args

  const { integrations: integrationsList } = await client.listIntegrations({
    name: 'instagram',
  })

  if (integrationsList.length === 0) {
    console.error('Integration not found')
    process.exit(1)
  }

  const integrations = (
    await Promise.all(
      integrationsList.map(async (i) => {
        const { integration } = await client.getIntegration({ id: i.id })
        if (!integration.secrets.some((secret) => secret === INTEGRATION_SECRET_SANDBOX_ACCESS_TOKEN)) {
          return null
        }
        return integration
      })
    )
  ).filter((i) => i !== null)

  if (integrations.length === 0) {
    console.error('No integration with secret', INTEGRATION_SECRET_SANDBOX_ACCESS_TOKEN, 'found')
    process.exit(1)
  }

  let data: { access_token: string }
  if (useProvidedToken) {
    log('Using provided token, skipping refresh on Instagram API')
    data = {
      access_token: instagramRefreshToken,
    }
  } else {
    log('Refreshing access token on Instagram API')
    const response = await axios.get(`${INSTAGRAM_GRAPH_API_URL}/refresh_access_token`, {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: instagramRefreshToken,
      },
    })
    data = response.data
  }

  for (const integration of integrations) {
    await client.updateIntegration({
      id: integration.id,
      public: integration.public,
      secrets: {
        [INTEGRATION_SECRET_SANDBOX_ACCESS_TOKEN]: data.access_token,
      },
    })
    log(
      `Updated integration secret ${INTEGRATION_SECRET_SANDBOX_ACCESS_TOKEN} for ${integration.name} v${integration.version} (${integration.id}) with new access token`
    )
  }

  return {
    refreshedToken: data.access_token,
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      apiUrl: { type: 'string', default: process.env.BP_API_URL || DEFAULT_API_URL },
      workspaceId: { type: 'string', default: process.env.BP_WORKSPACE_ID },
      token: { type: 'string', default: process.env.BP_TOKEN },
      instagramRefreshToken: { type: 'string' },
      json: { type: 'boolean', default: false },
      useProvidedToken: { type: 'boolean', default: false },
    },
  })

  try {
    const args = argsSchema.parse(values)
    const { apiUrl, token, workspaceId, instagramRefreshToken, json, useProvidedToken } = args
    if (apiUrl !== DEFAULT_API_URL && !json) {
      console.warn('🔗 Using custom API URL:', apiUrl)
    }

    const client = new Client({ apiUrl, token, workspaceId })
    const output = await refreshSandboxAccessToken({
      instagramRefreshToken,
      client,
      json,
      useProvidedToken,
      log: (message: string) => {
        if (!json) {
          console.info(message)
        }
      },
    })
    console.info(json ? JSON.stringify(output, null, 2) : `New token: ${output.refreshedToken}`)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
