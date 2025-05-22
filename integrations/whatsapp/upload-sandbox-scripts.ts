import 'dotenv/config'
import { Client } from '@botpress/client'
import axios from 'axios'
import fs from 'fs'

async function doUpload() {
  // Parse named command line arguments
  const args = process.argv.slice(2).reduce<Record<string, string | undefined>>((acc, arg) => {
    const [key, value] = arg.split('=')
    if (key && value) acc[key.replace(/^--/, '')] = value
    return acc
  }, {})

  const userEmail = args.userEmail
  const apiUrl = args.apiUrl || process.env.BP_API_URL || 'https://api.botpress.cloud'
  let integrationId = args.integrationId || process.env.BP_INTEGRATION_ID
  const integrationName = args.integrationName // TODO: Read from definition in the integration folder
  const integrationVersion = args.integrationVersion
  const token = args.token || process.env.BP_TOKEN
  const workspaceId = args.workspaceId || process.env.BP_WORKSPACE_ID

  const hasIntegrationInfos = integrationId || (integrationName && integrationVersion)
  if (!userEmail || !apiUrl || !hasIntegrationInfos || !token || !workspaceId) {
    console.error('Missing required arguments: userEmail, apiUrl, integrationId, token, workspaceId')
    console.error(
      'Usage: pnpm run ts-node -T upload-sandbox-scripts.ts --userEmail=<email> --apiUrl=<apiUrl> --token=<token> --workspaceId=<workspaceId> {--integrationId=<id> | --integrationName=<name> --integrationVersion=<version>} [--integrationPath=<path>]\n' +
        'integrationId, apiUrl, token, and workspaceId can also be set in the environment variables BP_INTEGRATION_ID, BP_API_URL, BP_TOKEN, BP_WORKSPACE_ID'
    )
    process.exit(1)
  }

  if (!integrationId && integrationName && integrationVersion) {
    // Fetch integrationId from the API using integrationName and integrationVersion
    console.info('Fetching integration infos from the API...')
    const client = new Client({ apiUrl, token })
    const { integration } = await client.getIntegrationByName({
      name: integrationName,
      version: integrationVersion,
    })
    integrationId = integration.id
  } else if (!integrationId) {
    console.error(
      'No integrationId found. Please provide either integrationId or integrationName and integrationVersion.'
    )
    process.exit(1)
  }
  console.info(`Integration ID: ${integrationId}`)

  async function updateIntegrationSandbox(props: {
    integrationId: string
    sandbox: { identifierExtractScript: string; messageExtractScript: string }
  }) {
    const { integrationId, sandbox } = props
    return await axios.put(
      `${apiUrl}/v1/corporate/integrations/${integrationId}/sandbox`,
      {
        ...sandbox,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-email': userEmail,
        },
      }
    )
  }

  const integrationPath = args.integrationPath || '.'

  const identifierExtractScriptPath = `${integrationPath}/sandboxIdentifierExtract.vrl`
  const messageExtractScriptPath = `${integrationPath}/sandboxShareableIdExtract.vrl`

  // TODO: Skip if the integration doesn't implement the sandbox feature (config named `sandbox`, identifier extract script present)

  const identifierExtractScript = fs.readFileSync(identifierExtractScriptPath, 'utf8')
  const messageExtractScript = fs.readFileSync(messageExtractScriptPath, 'utf8')

  return await updateIntegrationSandbox({
    integrationId,
    sandbox: {
      identifierExtractScript,
      messageExtractScript,
    },
  })
}

doUpload()
  .then((res) => {
    console.info('Sandbox scripts updated successfully', res.data)
  })
  .catch((err) => {
    console.error('Failed to update sandbox scripts', err)
  })
