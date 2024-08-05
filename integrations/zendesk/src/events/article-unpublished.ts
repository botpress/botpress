import { getZendeskClient } from 'src/client'
import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const articleUnpublished = async ({
  zendeskTrigger,
  client,
  logger,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  logger: bp.Logger
}) => {
  const existingFiles = await client.listFiles({
    tags: {
      zendeskId: `${zendeskTrigger.detail.id}`,
    },
  })

  const existingFile = existingFiles.files[0]

  if (!existingFile) {
    logger.forBot().error(`Unpublished article not found in the BP KB`)
    return
  }

  await client.deleteFile({ id: existingFile.id })
}
