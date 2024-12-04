import { createErrorHandlingDecorator } from '@botpress/common'
import { wrapAsyncFnWithTryCatch } from './error-redactor'

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
