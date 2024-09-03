import { Client } from '@notionhq/client'
import type { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_PROPERTY_STRINGIFIED_TYPE_MAP } from './notion.constants'
import type { NotionPagePropertyTypes } from './notion.types'
import * as bp from '.botpress'

// TODO: Write a decorator to achieve this

export function getNotionClient(integrationContext: bp.Context) {
  return new Client({
    auth: integrationContext.configuration.authToken,
  })
}

// TODO: Add types for property
/**
 * In Notion's parlance, a page in a database is a row in a table
 * @param databaseId
 * @param properties
 * @returns
 */
export function addPageToDb(
  integrationContext: bp.Context,
  databaseId: string,
  properties: Record<NotionPagePropertyTypes, any>
) {
  const notion = getNotionClient(integrationContext)
  return notion.pages.create({
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
export function addCommentToPage(integrationContext: bp.Context, blockId: string, messageBody: string) {
  const notion = getNotionClient(integrationContext)
  return notion.comments.create({
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

export function addCommentToDiscussion(integrationContext: bp.Context, discussionId: string, messageBody: string) {
  const notion = getNotionClient(integrationContext)
  return notion.comments.create({
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

export function getAllCommentsForBlock(integrationContext: bp.Context, blockId: string) {
  const notion = getNotionClient(integrationContext)
  return notion.comments.list({ block_id: blockId })
}

/**
 * Can be used to delete pages also which means the following things can be deleted:
 * - a page in a database
 * - a page
 * - a block
 */
export function deleteBlock(integrationContext: bp.Context, blockId: string) {
  const notion = getNotionClient(integrationContext)
  return notion.blocks.delete({ block_id: blockId })
}

export function getDb(integrationContext: bp.Context, databaseId: string) {
  const notion = getNotionClient(integrationContext)
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
