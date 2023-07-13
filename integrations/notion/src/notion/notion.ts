import type { configuration } from '.botpress'
import type { IntegrationContext } from '@botpress/sdk'
import { Client } from '@notionhq/client'
import type {
    CommentObjectResponse,
    GetDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints'
import { NOTION_PROPERTY_STRINGIFIED_TYPE_MAP } from './notion.constants'
import type { NotionPagePropertyTypes } from './notion.types'

// TODO: Write a decorator to achieve this
type BotpressIntegrationContext = IntegrationContext<configuration.Configuration>

export function getNotionClient(integrationContext: BotpressIntegrationContext) {
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
export function addPageToDb(integrationContext: BotpressIntegrationContext, databaseId: string, properties: Record<NotionPagePropertyTypes, any>) {
    const notion = getNotionClient(integrationContext);
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
export function addCommentToPage(integrationContext: BotpressIntegrationContext, blockId: string, messageBody: string) {
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

export function addCommentToDiscussion(
    integrationContext: BotpressIntegrationContext,
    discussionId: string,
    messageBody: string
) {
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

export function getAllCommentsForBlock(integrationContext: BotpressIntegrationContext, blockId: string) {
    const notion = getNotionClient(integrationContext)
    return notion.comments.list({ block_id: blockId })
}

/**
 * Can be used to delete pages also which means the following things can be deleted:
 * - a page in a database
 * - a page
 * - a block
 */
export function deleteBlock(integrationContext: BotpressIntegrationContext, blockId: string) {
    const notion = getNotionClient(integrationContext)
    return notion.blocks.delete({ block_id: blockId })
}

/**
 * Because notion doesn't keep track of seconds when a comment is updated, we need to poll for changes every 60 seconds.
 * @param pageId
 * @param onCommentChange is called for every comment that has been updated in the last polling interval
 */
function listenToCommentChangesOnThePage(
    integrationContext: BotpressIntegrationContext,
    pageId: string,
    onCommentChange: (comment: CommentObjectResponse) => Promise<void>
) {
    const pollingInterval = 60 * 1000
    let cursorMinute: number = new Date().getMinutes()

    const interval = setInterval(() => {
        console.log('Polling for changes...')
        getLatestComments().then((latestComments) => {
            incrementCursorMinute()
            Promise.all(latestComments.map(onCommentChange))
                .then(() => {
                    console.log('Successfully processed all comments')
                })
                .catch((err) => {
                    console.error('There was an error while processing one or more comments. - ', err)
                })
        })
    }, pollingInterval)

    async function getLatestComments() {
        const currentComments = await getCommentsForBlock(integrationContext, pageId)
        const latestComments = filterLatestComments(currentComments)
        console.info(`Found ${latestComments.length} comment(s) that have been updated in the last minute.`)
        return latestComments
    }

    function incrementCursorMinute() {
        cursorMinute = (cursorMinute + 1) % 60
    }

    /**
     *
     * @param currentComments
     * @returns comments that have been updated in the the current minute
     */
    function filterLatestComments(currentComments: CommentObjectResponse[]) {
        return currentComments.filter((comment) => {
            const lastEditedTime = new Date(comment.last_edited_time)
            // Filter out those that have been created by the integration itself to avoid infinite loops
            // last 10 minutes is to account for the delay in processing the comment; Theoretically anything over 60+buffer seconds should work
            return (
                Date.now() - lastEditedTime.valueOf() < 10 * 60 * 1000 &&
                cursorMinute === lastEditedTime.getMinutes()
                // The only place where integration id is needed - removing from the config for now
                // && comment.created_by.id !== integrationContext.integrationId
            )
        })
    }
    return interval
}

async function getCommentsForBlock(integrationContext: BotpressIntegrationContext, blockId: string) {
    const notion = getNotionClient(integrationContext)
    const comments = []
    let cursor = undefined

    while (true) {
        const { results, next_cursor } = await notion.comments.list({
            block_id: blockId,
            start_cursor: cursor,
        })
        comments.push(...results)
        if (!next_cursor) {
            break
        }
        cursor = next_cursor
    }
    console.log(`${comments.length} comments successfully fetched.`)
    return comments
}

export function getDb(integrationContext: BotpressIntegrationContext, databaseId: string) {
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
        _stringifiedTypes += `${key}:{type:"${value.type}";"${value.type}":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP[value.type]}}`
        if (index === properties.length - 1) {
            _stringifiedTypes += '}'
        } else {
            _stringifiedTypes += ','
        }
        return _stringifiedTypes
    }, '{')

    return stringifiedTypes
}

