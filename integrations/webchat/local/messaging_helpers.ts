import { ensureEnv } from './env'

export const getMessagingURL = () => ensureEnv('MESSAGING_URL')
export const getAdminKey = () => ensureEnv('MESSAGING_ADMIN_KEY')
export const getClientId = () => ensureEnv('MESSAGING_CLIENT_ID')
export const getClientToken = () => ensureEnv('MESSAGING_CLIENT_TOKEN')
export const getWebhookToken = () => ensureEnv('MESSAGING_WEBHOOK_TOKEN')

export const getServerBaseURLHost = () => ensureEnv('SERVER_BASE_URL_HOST')
export const getServerBaseURLDocker = () => ensureEnv('SERVER_BASE_URL_DOCKER')
export const getServerWebhookRoute = () => ensureEnv('SERVER_WEBHOOK_ROUTE')
