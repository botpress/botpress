import { NotionClient } from './notion'
import { getOAuthToken, handleOAuthCallback } from './oauth'
import * as bp from '.botpress'

export default new bp.Integration({
  createConversation: async ({ client, channel }) => {
    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: {},
    })
    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  channels: {},
  register: async () => {},
  unregister: async () => {},
  actions: {
    addCommentToDiscussion: async ({ client, ctx, input }) => {
      const auth = await getOAuthToken({ ctx, client })
      const notion = new NotionClient({
        auth,
      })
      await notion.comments.create({
        discussion_id: input.discussionId,
        rich_text: [
          {
            type: 'text',
            text: {
              content: input.commentBody,
            },
          },
        ],
      })

      return {}
    },
    addCommentToPage: async ({ client, ctx, input }) => {
      const auth = await getOAuthToken({ ctx, client })
      const notion = new NotionClient({
        auth,
      })
      return notion.comments.create({
        parent: { page_id: input.pageId },
        rich_text: [
          {
            type: 'text',
            text: {
              content: input.commentBody,
            },
          },
        ],
      })
    },
    getConnectedWorkspace: async ({ client, ctx }) => {
      const { state } = await client.getState({
        id: ctx.integrationId,
        name: 'oauth',
        type: 'integration',
      })
      return {
        workspace_icon: state.payload.workspace_icon,
        owner: state.payload.owner,
        workspace_id: state.payload.workspace_id,
        workspace_name: state.payload.workspace_name,
      }
    },
    listPages: async ({ client, ctx }) => {
      const auth = await getOAuthToken({ ctx, client })
      const notion = new NotionClient({
        auth,
      })
      const pages = await notion.listPages()
      return {
        meta: {},
        items: pages,
      }
    },
    createFilesFromPages: async ({ client, ctx, input }) => {
      const auth = await getOAuthToken({ ctx, client })
      const notion = new NotionClient({
        auth,
      })

      const files = await Promise.all(
        input.pages.map(async (page) => {
          const content = await notion.getPageContent(page.id)
          if (!content) {
            return
          }
          const buffer = Buffer.from(content ?? '', 'utf-8')

          const { file } = await client.upsertFile({
            ...(page.fileProps as any),
            size: buffer.byteLength,
          })

          await fetch(file.uploadUrl, {
            method: 'PUT',
            body: buffer,
          })

          return file
        })
      )

      return {
        files: files.filter((f) => f !== undefined),
      }
    },
  },
  handler: async (props) => {
    const { req, logger } = props
    if (req.path.startsWith('/oauth')) {
      logger.forBot().info('Handling Notion OAuth callback')

      await handleOAuthCallback(props)
    }
    return
  },
})
