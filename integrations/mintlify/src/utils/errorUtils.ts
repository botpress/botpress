import * as bp from '.botpress'

export const extractError = (error: any, logger: bp.Logger) => {
  const fullErrorMsg = `${error?.errorCode || error?.message || 'Error'}`
  if (error.response.data) logger.forBot().error(JSON.stringify(error.response.data))
  logger.forBot().error(fullErrorMsg)
  logger.forBot().error(JSON.stringify(error))
  return fullErrorMsg
}
