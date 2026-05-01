import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import { RuntimeError } from '@botpress/sdk'

export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error, customMessage) => {
  if (error instanceof RuntimeError) return error
  console.warn(customMessage, error)
  return new RuntimeError(`${customMessage}: ${error.message}`)
})

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapWithTryCatch)
