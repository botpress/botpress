import * as sdk from '@botpress/sdk'
import { uploadArticlesToKb } from 'src/misc/upload-articles-to-kb'
import { deleteKbArticles } from 'src/misc/utils'
import * as bp from '.botpress'

export const syncKb: bp.IntegrationProps['actions']['syncKb'] = async (props) => {
  try {
    const { client, ctx, input, logger } = props
    const kbId = input.knowledgeBaseId

    await deleteKbArticles(kbId, client)

    await uploadArticlesToKb({ ctx, client, logger, kbId })

    return {
      success: true,
    }
  } catch (error) {
    throw new sdk.RuntimeError(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
  }
}
