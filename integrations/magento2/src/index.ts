// import * as sdk from '@botpress/sdk'
import { getProducts } from './actions'
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
  },
  channels: {},
  handler: async () => {},
})
