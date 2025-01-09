import * as notion from '../notion'
import * as bp from '.botpress'

export const deleteBlock: bp.IntegrationProps['actions']['deleteBlock'] = async ({ ctx, input }) => {
  try {
    const response = await notion.deleteBlock(ctx, input.blockId)
    if (response) {
      console.info('Successfully deleted the block')
      return {}
    } else {
      return {}
    }
  } catch {
    return {}
  }
}
