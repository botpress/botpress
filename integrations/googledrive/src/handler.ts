import { updateRefreshTokenFromAuthorizationCode } from './auth'
import { Client } from './client'
import { FileChannelsCache } from './file-channels-cache'
import { FileEventHandler } from './file-event-handler'
import { FilesCache } from './files-cache'
import { NotificationHandler } from './notification-handler'
import { notificationSchema } from './schemas'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props
  if (req.path.startsWith('/oauth')) {
    return await handleOAuth(props)
  }

  const notifParseResult = notificationSchema.safeParse(req)
  if (!notifParseResult.success) {
    console.error('Invalid request:', notifParseResult.error)
    return {
      status: 400,
      body: 'Invalid request',
    }
  }

  const notification = notifParseResult.data
  if (!NotificationHandler.isSupported(notification)) {
    return
  }

  const driveClient = await Client.create({ client, ctx, logger })
  const filesCache = await FilesCache.load({ client, ctx })
  const fileChannelsCache = await FileChannelsCache.load({ client, ctx })
  const fileEventHandler = new FileEventHandler(client, driveClient, filesCache, fileChannelsCache)
  const notificationHandler = new NotificationHandler(driveClient, filesCache, fileEventHandler)
  await notificationHandler.handle(notification)
  await filesCache.save()
  await fileChannelsCache.save()
}

export const handleOAuth = async ({ req, client, ctx }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    console.error('Error extracting code from url in OAuth handler')
    return
  }

  await updateRefreshTokenFromAuthorizationCode({ authorizationCode, client, ctx })

  // Done in order to correctly display the authorization status in the UI (not used for webhooks)
  client.configureIntegration({
    identifier: ctx.webhookId,
  })
}
