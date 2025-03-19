import syncProducts from './sync-products'
import * as bp from '.botpress'

export default {
  syncProducts,
} satisfies bp.ActionHandlers<bp.TIntegration>
