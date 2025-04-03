import {
  createAsyncFnWrapperWithErrorRedaction,
  createErrorHandlingDecorator,
  defaultErrorRedactor,
} from '@botpress/common'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)
export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
