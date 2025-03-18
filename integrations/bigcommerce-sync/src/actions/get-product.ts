import * as bp from '.botpress'
import { getBigCommerceClient } from '../client'

const getProduct = async ({ 
  ctx, 
  input 
}: any) => {
  const bigCommerceClient = getBigCommerceClient(ctx.configuration)
  const { productId } = input
  
  try {
    const response = await bigCommerceClient.getProduct(productId)
    return {
      product: response.data,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Error getting product with id: ' + productId,
    }
  }
}

export default getProduct 