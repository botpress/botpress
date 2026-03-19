import { logForBotAndThrow } from '../misc/util'
import { fetchTemplates } from '../misc/template-utils'
import * as bp from '.botpress'

export const listTemplates: bp.IntegrationProps['actions']['listTemplates'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  if (ctx.configurationType === 'sandbox') {
    logForBotAndThrow('Listing templates is not supported in sandbox mode', logger)
  }

  const response = await fetchTemplates(ctx, client, logger, {
    fields: 'id,name,status,category,language,components',
    limit: Math.min(input.limit ?? 20, 100),
    status: input.status,
    name: input.name,
    after: input.nextCursor,
  })

  const templates = (response.data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    status: template.status,
    category: template.category,
    language: template.language,
    components: (template.components ?? []).map((comp) => ({
      type: comp.type,
      format: comp.format,
      text: comp.text,
      buttons: comp.buttons?.map((btn) => ({
        type: btn.type,
        text: btn.text,
        url: btn.url,
        phone_number: btn.phone_number,
      })),
      example: comp.example,
    })),
  }))

  const nextCursor: string | undefined = response.paging?.cursors?.after

  return {
    templates,
    nextCursor,
  }
}
