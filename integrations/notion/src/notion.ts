import { z } from '@botpress/sdk'
import { Client as NotionBaseClient } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { ClientOptions } from '@notionhq/client/build/src/Client'

export namespace NotionEntities {
  export const Page = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    url: z.string().min(1),
    icon: z.union([
      z.object({
        type: z.literal('emoji'),
        emoji: z.string(),
      }),
      z.null(),
      z.object({
        type: z.literal('external'),
        external: z.object({
          url: z.string(),
        }),
      }),
      z.null(),
      z.object({
        type: z.literal('file'),
        file: z.object({
          url: z.string(),
          expiry_time: z.string(),
        }),
      }),
      z.null(),
      z.object({
        type: z.literal('custom_emoji'),
        custom_emoji: z.object({
          name: z.string(),
          url: z.string(),
        }),
      }),
      z.null(),
    ]),
  })
  export type Page = z.infer<typeof Page>

  /**
   * Refer - https://developers.notion.com/docs/authorization#step-4-notion-responds-with-an-access_token-and-additional-information
   */
  export const AuthTokenResponse = z.object({
    access_token: z.string().min(1).describe('An access token used to authorize requests to the Notion API.'),
    bot_id: z.string().min(1).describe('An identifier for this authorization.'),
    owner: z
      .object({
        workspace: z.boolean().optional(),
        user: z.object({}).passthrough().optional(),
      })
      .describe(
        'An object containing information about who can view and share this integration. { "workspace": true } is returned for installations of workspace-level tokens. For user level tokens, a user object is returned.'
      ),
    workspace_icon: z
      .string()
      .url()
      .nullable()
      .describe('A URL to an image that can be used to display this authorization in the UI.'),
    workspace_id: z.string().min(1).describe('The ID of the workspace where this authorization took place.'),
    workspace_name: z
      .string()
      .optional()
      .describe('A human-readable name that can be used to display this authorization in the UI.'),
    duplicated_template_id: z
      .string()
      .nullable()
      .describe(
        "The ID of the new page created in the user's workspace. The new page is a duplicate of the template that the developer provided with the integration. If the developer didn’t provide a template for the integration, then the value is null."
      ),
  })
  export type AuthTokenResponse = z.infer<typeof AuthTokenResponse>
}

export class NotionClient extends NotionBaseClient {
  public constructor(options: ClientOptions) {
    super(options)
  }

  // TODO: add pagination
  public async listPages(): Promise<NotionEntities.Page[]> {
    const response = await this.search({
      filter: {
        property: 'object',
        value: 'page',
      },
    })
    const pages: NotionEntities.Page[] = []

    for (const p of response.results) {
      if (!NotionClient.isPageObjectResponse(p)) {
        continue
      }
      const title = NotionClient.findPageTitle(p) || `Untitled page - (${p.id})`
      pages.push({
        id: p.id,
        icon: p.icon,
        title,
        url: p.url,
      })
    }

    return pages
  }

  public static findPageTitle(result: PageObjectResponse) {
    if (result.object === 'page') {
      const titleObject = result.properties?.title
      if (titleObject?.type === 'title' && titleObject.title[0]?.plain_text) {
        return titleObject.title[0]?.plain_text
      }
      return ''
    }
    return ''
  }

  public static isPageObjectResponse(response: any): response is PageObjectResponse {
    return response.object === 'page' && 'parent' in response && 'properties' in response && 'created_time' in response
  }
}
