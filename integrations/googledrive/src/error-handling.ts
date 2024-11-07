import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'

export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)
