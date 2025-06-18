import type { ZodType, ZodError, input } from '@botpress/sdk'
import { RuntimeError } from '@botpress/sdk'
import { ValidationResult } from './custom-types'

export const validateData = <Schema extends ZodType>(schema: Schema, data: input<Schema>): ValidationResult<Schema> => {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      isSuccess: false,
      error: zodErrorToRuntimeError(result.error),
    }
  }

  return {
    isSuccess: true,
    data: result.data,
  }
}

export const zodErrorToRuntimeError = (thrown: ZodError) => {
  const invalidFields = thrown.issues.reduce((prettyInvalidFields, issue) => {
    const formattedPath = issue.path.join('.')
    prettyInvalidFields += `\n\t- '${issue.message}' (${formattedPath})`
    return prettyInvalidFields
  }, '')

  // TODO: Test if the above formatting is correctly displayed in the error tracker and via the logger
  return new RuntimeError(`Invalid data detected for the following fields:${invalidFields}`, thrown)
}
