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

  const requestConfig = {
    method: 'get',
    url: `/api/v2/help_center/articles/${zendeskTrigger.detail.id}`,
    params: {
      per_page: 1,
    },
  }

  const zendeskClient = getZendeskClient(ctx.configuration)

  const { data: zendeskArticle } = await zendeskClient.makeRequest(requestConfig)
  console.log(zendeskArticle, 'znd')
  // await client.deleteFile({ id: existingFiles.files[0]?.id })

  // const kbId = ctx.configuration.knowledgeBaseId

  // await client.uploadFile({
  //   key: `${kbId}/${article.id}.html`,
  //   accessPolicies: [],
  //   content: article.body,
  //   index: true,
  //   tags: {
  //     source: 'knowledge-base',
  //     kbId,
  //     title: article.title,
  //     labels: article.label_names.join(' '),
  //     id: `${article.id}`,
  //   },
  // })
}
