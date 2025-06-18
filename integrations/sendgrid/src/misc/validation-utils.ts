import type { ZodError } from '@botpress/sdk'
import { RuntimeError } from '@botpress/sdk'

export const zodErrorToRuntimeError = (thrown: ZodError) => {
  const invalidFields = thrown.issues.reduce((prettyInvalidFields, issue) => {
    const formattedPath = issue.path.join('.')
    prettyInvalidFields += `\n\t- '${issue.message}' (${formattedPath})`
    return prettyInvalidFields
  }, '')

  // TODO: Test if the above formatting is correctly displayed in the error tracker and via the logger
  return new RuntimeError(`Invalid data detected for the following fields:${invalidFields}`, thrown)
}
