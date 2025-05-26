import * as sdk from '@botpress/sdk'
import * as filesReadonly from '../../files-readonly'
import { NotionClient } from '../../notion-api'
import { BASE_EVENT_PAYLOAD } from '../base-payload'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = BASE_EVENT_PAYLOAD.extend({
  type: sdk.z.enum(['page.created', 'page.undeleted']),
  entity: BASE_EVENT_PAYLOAD.shape.entity.extend({
    type: sdk.z.literal('page'),
  }),
})

export const isPageCreatedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handlePageCreatedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)

  const notionClient = await NotionClient.create(props)
  const createdPage = await notionClient.getPage({ pageId: payload.entity.id })

  if (!createdPage) {
    console.debug(`Notion page ${payload.entity.id} not found. Ignoring page.created event.`)
    return
  }

  const pageName = filesReadonly.getPageTitle(createdPage)
  const parentPath = await filesReadonly.retrieveParentPath(createdPage.parent, notionClient)
  const absolutePath = `/${parentPath}/${pageName}/${filesReadonly.PAGE_FILE_NAME}`

  await props.client.createEvent({
    type: 'fileCreated',
    payload: {
      file: {
        ...filesReadonly.mapPageToFile(createdPage),
        absolutePath,
      },
    },
  })
}
