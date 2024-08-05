import { getZendeskClient } from 'src/client'
import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const synPublishedArticle = async ({
  zendeskTrigger,
  client,
  ctx,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
}) => {
  console.log(zendeskTrigger, 'trigga')

  const existingFiles = await client.listFiles({
    tags: {
      id: `${zendeskTrigger.detail.id}`,
    },
  })
  const existingFile = existingFiles.files[0]

  const requestConfig = {
    method: 'get',
    url: `/api/v2/help_center/articles/${zendeskTrigger.detail.id}`,
    params: {
      per_page: 1,
    },
  }

  const zendeskClient = getZendeskClient(ctx.configuration)

  const {
    data: { article: zendeskArticle },
  } = await zendeskClient.makeRequest(requestConfig)

  console.log(zendeskArticle, 'znd')

  const kbId = ctx.configuration.knowledgeBaseId

  const j = await client.uploadFile({
    key: existingFile?.key,
    accessPolicies: [],
    content: zendeskArticle.body,
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      title: zendeskArticle.title,
      labels: zendeskArticle.label_names.join(' '),
      id: `${zendeskArticle.id}`,
    },
  })

  console.log(j, 'uploaded')
}
