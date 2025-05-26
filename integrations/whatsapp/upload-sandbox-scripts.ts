import 'dotenv/config'
import { Client } from '@botpress/client'
import axios from 'axios'
import { spawnSync } from 'child_process'
import fs from 'fs'

type Args = Record<string, string | undefined>

const DEFAULT_API_URL = 'https://api.botpress.cloud'

function readIntegrationDefinition(integrationPath: string): any {
  const readCmdResult = spawnSync('pnpm', ['exec', 'bp', 'read', '--json', '--workDir', integrationPath])
  if (readCmdResult.status !== 0) {
    throw new Error(
      `Failed to read integration definition: ${readCmdResult.error?.message || readCmdResult.stderr.toString() || 'Unknown error'}`
    )
  }
  return JSON.parse(readCmdResult.stdout.toString())
}

function parseArgs(): Args {
  return process.argv.slice(2).reduce<Record<string, string | undefined>>((acc, arg) => {
    const [key, value] = arg.split('=')
    if (key && value) acc[key.replace(/^--/, '')] = value
    return acc
  }, {})
}

async function uploadScripts({
  apiUrl,
  token,
  workspaceId,
  userEmail,
  integrationId,
  integrationPath,
}: {
  apiUrl: string
  token: string
  workspaceId: string
  userEmail: string
  integrationId?: string
  integrationPath?: string
}) {
  if (apiUrl !== DEFAULT_API_URL) {
    console.debug(`🔗 Using custom url ${apiUrl}`)
  }
  if (integrationId) {
    console.debug(`🧩 Using custom integration ID ${integrationId}`)
  }

  integrationPath ||= '.'
  console.info('Reading integration definition...')
  const { name, version } = readIntegrationDefinition(integrationPath)

  const client = new Client({ apiUrl, token, workspaceId })
  let integration: Awaited<ReturnType<Client['getIntegrationByName']>>['integration']
  console.info(`Fetching remote integration definition ${name} ${version}...`)
  if (!integrationId) {
    console.debug('No integration ID provided, searching by name and version')
    const getIntegrationResponse = await client.getIntegrationByName({
      name,
      version,
    })
    integration = getIntegrationResponse.integration
  } else {
    console.debug('Integration ID provided, fetching by ID')
    const getIntegrationResponse = await client.getIntegration({
      id: integrationId,
    })
    integration = getIntegrationResponse.integration
  }

  integrationId = integration.id
  console.info(`Integration ID: ${integrationId}`)
  if (!integration.configurations['sandbox']) {
    console.info('Integration does not implement the sandbox feature, no scripts to upload')
    process.exit(0)
  }

  const identifierExtractScriptPath = `${integrationPath}/sandboxIdentifierExtract.vrl`
  const messageExtractScriptPath = `${integrationPath}/sandboxShareableIdExtract.vrl`
  const identifierExtractScript = fs.readFileSync(identifierExtractScriptPath, 'utf8')
  const messageExtractScript = fs.readFileSync(messageExtractScriptPath, 'utf8')

  return await await axios.put(
    `${apiUrl}/v1/corporate/integrations/${integrationId}/sandbox`,
    {
      identifierExtractScript,
      messageExtractScript,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-user-email': userEmail,
      },
    }
  )
}

const args = parseArgs()
const apiUrl = args.apiUrl || process.env.BP_API_URL || DEFAULT_API_URL
const token = args.token || process.env.BP_TOKEN
const workspaceId = args.workspaceId || process.env.BP_WORKSPACE_ID
const userEmail = args.userEmail
const integrationId = args.integrationId || process.env.BP_INTEGRATION_ID
const integrationPath = args.integrationPath
if (!userEmail || !token || !workspaceId) {
  console.error('Missing required arguments: userEmail, token, workspaceId')
  console.error(
    'Usage: pnpm run ts-node -T upload-sandbox-scripts.ts --userEmail=<email> --token=<token> --workspaceId=<workspaceId> [--apiUrl=<apiUrl>] [--integrationId=<id>] [--integrationPath=<path>]\n' +
      'integrationId, apiUrl, token, and workspaceId can also be set in the environment variables BP_INTEGRATION_ID, BP_API_URL, BP_TOKEN, BP_WORKSPACE_ID'
  )
  process.exit(1)
}

uploadScripts({
  apiUrl,
  token,
  workspaceId,
  userEmail,
  integrationId,
  integrationPath,
})
  .then((res) => {
    console.info('Sandbox scripts updated successfully:', res.data)
  })
  .catch((error) => {
    console.error('Failed to update sandbox scripts')
    if (error.response) {
      console.error('Error Data:', error.response.data)
      console.error('Error Status:', error.response.status)
      console.error('Error Headers:', error.response.headers)
    } else if (error.request) {
      console.error('Error Request:', error.request)
    } else {
      console.error('Error Message:', error.message)
    }
  })
