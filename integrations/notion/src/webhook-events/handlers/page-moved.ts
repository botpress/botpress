import * as sdk from '@botpress/sdk'
import * as filesReadonly from '../../files-readonly'
import { NotionClient } from '../../notion-api'
import { BASE_EVENT_PAYLOAD } from '../base-payload'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = BASE_EVENT_PAYLOAD.extend({
  type: sdk.z.literal('page.moved'),
  entity: BASE_EVENT_PAYLOAD.shape.entity.extend({
    type: sdk.z.literal('page'),
  }),
})

export const isPageMovedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handlePageMovedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)

  const notionClient = await NotionClient.create(props)
  const movedPage = await notionClient.getPage({ pageId: payload.entity.id })

  if (!movedPage) {
    console.debug(`Notion page ${payload.entity.id} not found. Ignoring page.moved event.`)
    return
  }

  const pageName = filesReadonly.getPageTitle(movedPage)
  const parentPath = await filesReadonly.retrieveParentPath(movedPage.parent, notionClient)
  const absolutePath = `/${parentPath}/${pageName}`

  await props.client.createEvent({
    type: 'fileUpdated',
    payload: {
      file: {
        ...filesReadonly.mapPageToFile(movedPage),
        absolutePath: `${absolutePath}/${filesReadonly.PAGE_FILE_NAME}`,
      },
    },
  })
}
