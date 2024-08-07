import * as bp from '.botpress'
import { ZendeskArticle } from './syncZendeskKbToBpKb'

export const stringifyProperties = (obj: Record<string, any>) => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = JSON.stringify(value)
  }
  return result
}

export const getUploadFilePayload = ({
  ctx,
  article,
  existingFileKey,
  logger,
}: {
  ctx: bp.Context
  article: ZendeskArticle
  existingFileKey?: string
  logger: bp.Logger
}) => {
  const kbId = ctx.configuration.knowledgeBaseId
  if (!kbId) {
    logger.forBot().error('Knowledge base id was not provided')
    return
  }
  const { body, id, title, locale, label_names } = article

  return {
    key: existingFileKey || `${kbId}/${id}.html`,
    accessPolicies: [],
    content: body,
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      title,
      labels: label_names.join(' '),
      zendeskId: `${article.id}`,
    },
  }
}
