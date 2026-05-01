import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import { z, RuntimeError } from '@botpress/sdk'
import axios from 'axios'

const linearOAuthErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
})

export const redactLinearError = (thrown: unknown, genericErrorMessage: string): RuntimeError => {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown))

  console.warn('Linear error', { error, genericErrorMessage })

  if (error instanceof RuntimeError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data
    const parsed = linearOAuthErrorSchema.safeParse(data)

    if (parsed.success) {
      const { error: code, error_description: description } = parsed.data
      const detail = description ? `${code}: ${description}` : code
      return new RuntimeError(`${genericErrorMessage}: ${detail}${status ? ` (HTTP ${status})` : ''}`)
    }

    const fallback = typeof data === 'string' && data.length > 0 ? data : data ? JSON.stringify(data) : error.message
    return new RuntimeError(`${genericErrorMessage}: ${fallback}${status ? ` (HTTP ${status})` : ''}`)
  }

  return new RuntimeError(`${genericErrorMessage}: ${error.message}`)
}

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(redactLinearError)

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
