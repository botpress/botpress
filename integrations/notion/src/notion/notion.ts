import { Client as NotionClient } from '@notionhq/client'
import type { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_PROPERTY_STRINGIFIED_TYPE_MAP } from './notion.constants'
import type { NotionPagePropertyTypes } from './notion.types'
import * as bp from '.botpress'

// TODO: Write a decorator to achieve this

export async function getNotionClient(integrationContext: bp.Context, client: bp.Client) {
  const bearerToken = await _getBearerToken(integrationContext, client)

  return new NotionClient({
    auth: bearerToken,
  })
}

const _getBearerToken = async (integrationContext: bp.Context, client: bp.Client) => {
  let bearerToken = ''

  if (integrationContext.configurationType === 'customApp') {
    bearerToken = integrationContext.configuration.authToken
  } else {
    const { state } = await client.getState({
      type: 'integration',
      id: integrationContext.integrationId,
      name: 'oauth',
    })
    bearerToken = state.payload.authToken
  }

  return bearerToken
}

export const getNotionBotUser = async (integrationContext: bp.Context, client: bp.Client) => {
  const notion = await getNotionClient(integrationContext, client)
  const botUser = notion.users.me({})

  return botUser
}

// TODO: Add types for property
/**
 * In Notion's parlance, a page in a database is a row in a table
 * @param databaseId
 * @param properties
 * @returns
 */
export async function addPageToDb(
  integrationContext: bp.Context,
  client: bp.Client,
  databaseId: string,
  properties: Record<NotionPagePropertyTypes, any>
) {
  const notion = await getNotionClient(integrationContext, client)
  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  })
}

/**
 * As of today, Notion API does not support adding comments to a block
 * https://developers.notion.com/docs/working-with-comments#comments-in-notions-ui-vs-using-the-rest-api
 * @param blockId
 * @param messageBody
 * @returns
 */
export async function addCommentToPage(
  integrationContext: bp.Context,
  client: bp.Client,
  blockId: string,
  messageBody: string
) {
  const notion = await getNotionClient(integrationContext, client)
  return await notion.comments.create({
    parent: { page_id: blockId },
    rich_text: [
      {
        type: 'text',
        text: {
          content: messageBody,
        },
      },
    ],
  })
}

export async function addCommentToDiscussion(
  integrationContext: bp.Context,
  client: bp.Client,
  discussionId: string,
  messageBody: string
) {
  const notion = await getNotionClient(integrationContext, client)
  return await notion.comments.create({
    discussion_id: discussionId,
    rich_text: [
      {
        type: 'text',
        text: {
          content: messageBody,
        },
      },
    ],
  })
}

export async function getAllCommentsForBlock(integrationContext: bp.Context, client: bp.Client, blockId: string) {
  const notion = await getNotionClient(integrationContext, client)
  return await notion.comments.list({ block_id: blockId })
}

/**
 * Can be used to delete pages also which means the following things can be deleted:
 * - a page in a database
 * - a page
 * - a block
 */
export async function deleteBlock(integrationContext: bp.Context, client: bp.Client, blockId: string) {
  const notion = await getNotionClient(integrationContext, client)
  return await notion.blocks.delete({ block_id: blockId })
}

export async function getDb(integrationContext: bp.Context, client: bp.Client, databaseId: string) {
  const notion = await getNotionClient(integrationContext, client)
  return notion.databases.retrieve({ database_id: databaseId })
}

/**
 * @returns a stringified type definition of the database properties
 * This can be useful when instructing GPT to parse some data to fit the db model
 * which can be then passed as properties to `addPageToDb`
 *
 * These are based on the [Notion Page Properties](https://developers.notion.com/reference/page-property-values)
 */
export function getDbStructure(response: GetDatabaseResponse): string {
  const properties = Object.entries(response.properties)
  const stringifiedTypes: string = properties.reduce((_stringifiedTypes, [key, value], index) => {
    _stringifiedTypes += `${key}:{type:"${value.type}";"${value.type}":${
      NOTION_PROPERTY_STRINGIFIED_TYPE_MAP[value.type]
    }}`
    if (index === properties.length - 1) {
      _stringifiedTypes += '}'
    } else {
      _stringifiedTypes += ','
    }
    return _stringifiedTypes
  }, '{')

  return stringifiedTypes
}

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ req, client, ctx }) => {
  const searchParams = new URLSearchParams(req.query)
  const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

  const notion = new NotionClient({})
  const response = await notion.oauth.token({
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: searchParams.get('code') ?? '',
    redirect_uri: REDIRECT_URI,
  })
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: { authToken: response.access_token },
  })

  await client.configureIntegration({
    identifier: response.workspace_id,
  })
}
