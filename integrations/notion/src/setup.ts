import { NotionClient } from './notion-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  const notionClient = await NotionClient.create(props)
  await notionClient.testAuthentication()
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
