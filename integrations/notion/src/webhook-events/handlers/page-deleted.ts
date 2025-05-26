import * as sdk from '@botpress/sdk'
import * as filesReadonly from '../../files-readonly'
import { NotionClient } from '../../notion-api'
import { BASE_EVENT_PAYLOAD } from '../base-payload'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = BASE_EVENT_PAYLOAD.extend({
  type: sdk.z.literal('page.deleted'),
  entity: BASE_EVENT_PAYLOAD.shape.entity.extend({
    type: sdk.z.literal('page'),
  }),
})

export const isPageDeletedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handlePageDeletedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)

  const notionClient = await NotionClient.create(props)
  const deletedPage = await notionClient.getPage({ pageId: payload.entity.id })

  if (!deletedPage) {
    console.debug(`Notion page ${payload.entity.id} not found. Ignoring page.deleted event.`)
    return
  }

  const pageName = filesReadonly.getPageTitle(deletedPage)
  const parentPath = await filesReadonly.retrieveParentPath(deletedPage.parent, notionClient)
  const absolutePath = `/${parentPath}/${pageName}`

  await props.client.createEvent({
    type: 'folderDeletedRecursive',
    payload: {
      folder: {
        ...filesReadonly.mapPageToFolder(deletedPage),
        absolutePath,
      },
    },
  })
}
