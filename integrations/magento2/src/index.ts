// import * as sdk from '@botpress/sdk'
import { getProducts, getStockItem } from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    console.log('register')
  },
  unregister: async () => {
    console.log('unregister')
  },
  actions: {
    getProducts,
    getStockItem,
  },
  channels: {},
  handler: async () => {},
})
