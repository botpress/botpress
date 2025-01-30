import {
  createAsyncFnWrapperWithErrorRedaction,
  defaultErrorRedactor,
  createErrorHandlingDecorator,
} from '@botpress/common'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
