import { getZendeskClient } from 'src/client'
import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'
import { stringifyProperties } from 'src/misc/utils'
import { ZendeskArticle } from 'src/misc/syncZendeskKbToBpKb'

export const articlePublished = async ({
  zendeskTrigger,
  client,
  ctx,
  logger,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  const kbId = ctx.configuration.knowledgeBaseId
  if (!kbId) {
    logger.forBot().error('Knowledge base id was not provided')
    return
  }
  const existingFiles = await client.listFiles({
    tags: {
      zendeskId: `${zendeskTrigger.detail.id}`,
    },
  })
  const existingFile = existingFiles.files[0]

  const zendeskClient = getZendeskClient(ctx.configuration)

  const response: { data: { article: ZendeskArticle } } = await zendeskClient.makeRequest({
    method: 'get',
    url: `/api/v2/help_center/articles/${zendeskTrigger.detail.id}`,
  })

  const { body: articleBody, id: articleId, ...articleMeta } = response.data.article

  //if file exists - update, otherwise create new file
  await client.uploadFile({
    key: existingFile?.key || `${articleId}.html`,
    accessPolicies: [],
    content: articleBody || ' ',
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      zendeskId: `${articleId}`,
      ...stringifyProperties(articleMeta),
    },
  })
}
