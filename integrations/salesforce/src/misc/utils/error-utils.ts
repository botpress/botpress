import * as bp from '.botpress'

export const handleError = (errorMsg: string, error: any, logger: bp.Logger) => {
  const fullErrorMsg = `${errorMsg} ${error?.errorCode || error?.message || 'Error'}`
  logger.forBot().error(fullErrorMsg)
  logger.forBot().error(JSON.stringify(error))

  return {
    success: false,
    error: fullErrorMsg,
  } as const
}
