import * as notion from '../notion'
import type { IntegrationProps } from '.botpress'

export const deleteBlock: IntegrationProps['actions']['deleteBlock'] = async ({ ctx, input }) => {
  try {
    const response = await notion.deleteBlock(ctx, input.blockId)
    if (response) {
      console.info('Successfully deleted the block')
      return {}
    } else {
      return {}
    }
  } catch (error) {
    return {}
  }
}
