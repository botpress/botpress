import * as bp from '.botpress'
import { getAccessToken} from './auth'
import { Client } from './client'
import { setStateConfiguration } from './config'

export const register: bp.IntegrationProps['register'] = async ({ logger, client, ctx }) => {
    logger.forBot().info('Registering Todoist integration')
    const accessToken = await getAccessToken(client, ctx)
    if (!accessToken) {
        return
    }
    
    const todoistClient = new Client(accessToken)
    const userId = await todoistClient.getUserId()
    await setStateConfiguration(client, ctx, { botUserId: userId })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
    logger.forBot().info('Unregistering Todoist integration')
} 

export default {
    register,
    unregister,
}