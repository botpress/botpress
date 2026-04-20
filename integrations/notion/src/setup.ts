import { RuntimeError } from '@botpress/sdk'
import { NotionClient } from './notion-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  try {
    const notionClient = await NotionClient.create(props)
    await notionClient.testAuthentication()
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Registering Notion integration failed: ${error.message}`)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { client } = props
  await client.configureIntegration({
    identifier: null,
  })
}
