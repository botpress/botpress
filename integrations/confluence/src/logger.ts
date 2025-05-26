import { IntegrationLogger } from '@botpress/sdk'

export const debugLog = (logger: IntegrationLogger, functionName: string, message: string) => {
  logger.debug(`Debug :: [${functionName}] ${message}`)
}

export const errorLog = (logger: IntegrationLogger, functionName: string, message: string) => {
  logger.error(`Error :: [${functionName}] ${message}`)
}
