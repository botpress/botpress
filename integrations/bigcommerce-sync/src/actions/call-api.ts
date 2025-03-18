import * as bp from '.botpress'
import { getBigCommerceClient } from '../client'

const callApi = async ({ 
  ctx, 
  input 
}: any) => {
  const bigCommerceClient = getBigCommerceClient(ctx.configuration)
  const { method, path, params, body } = input
  
  try {
    const config = {
      method,
      url: path,
      params: params ? JSON.parse(params) : undefined,
      data: body ? JSON.parse(body) : undefined
    }
    
    const response = await bigCommerceClient.makeRequest(config)
    return response
  } catch (error) {
    return {
      status: 500,
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default callApi 