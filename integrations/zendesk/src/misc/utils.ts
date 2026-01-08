import { ZendeskArticle } from 'src/definitions/schemas'
import * as bp from '.botpress'

export const stringifyProperties = (obj: Record<string, any>) => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = JSON.stringify(value)
  }
  return result
}

export const getUploadArticlePayload = ({ kbId, article }: { kbId: string; article: ZendeskArticle }) => {
  const { body, id, title, locale, label_names } = article

  return {
    key: `${kbId}/${id}.html`,
    accessPolicies: [],
    content: body,
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      title,
      locale,
      labels: label_names.join(' '),
      zendeskId: `${id}`,
    },
  }
}
export const deleteKbArticles = async (kbId: string, client: bp.Client): Promise<void> => {
  const { files } = await client.listFiles({
    tags: {
      kbId,
    },
  })

  for (const file of files) {
    await client.deleteFile({ id: file.id })
  }
}
