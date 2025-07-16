import * as sdk from '@botpress/sdk'
import * as filesReadonly from '../../files-readonly'
import { NotionClient } from '../../notion-api'
import { BASE_EVENT_PAYLOAD } from '../base-payload'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = BASE_EVENT_PAYLOAD.extend({
  type: sdk.z.literal('database.deleted'),
  entity: BASE_EVENT_PAYLOAD.shape.entity.extend({
    type: sdk.z.literal('database'),
  }),
})

export const isDatabaseDeletedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handleDatabaseDeletedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)

  const notionClient = await NotionClient.create(props)
  const deletedDatabase = await notionClient.getDatabase({ databaseId: payload.entity.id })

  if (!deletedDatabase) {
    console.debug(`Notion database ${payload.entity.id} not found. Ignoring database.deleted event.`)
    return
  }

  const databaseName = filesReadonly.getDatabaseTitle(deletedDatabase)
  const parentPath = await filesReadonly.retrieveParentPath(deletedDatabase.parent, notionClient)
  const absolutePath = `/${parentPath}/${databaseName}`

  await props.client.createEvent({
    type: 'folderDeletedRecursive',
    payload: {
      folder: {
        ...filesReadonly.mapDatabaseToFolder(deletedDatabase),
        absolutePath,
      },
    },
  })
}
