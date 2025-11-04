import { ZodError } from '@bpinternal/zui'

export class JsonParsingError extends Error {
  public constructor(
    public json: unknown,
    public error: Error
  ) {
    const message = JsonParsingError._formatError(json, error)
    super(message)
  }

  private static _formatError(json: unknown, error: Error): string {
    let errorMessage = 'Error parsing JSON:\n\n'
    errorMessage += `---JSON---\n${json}\n\n`

    if (error instanceof ZodError) {
      errorMessage += '---Validation Errors---\n\n'
      errorMessage += JsonParsingError._formatZodError(error)
    } else {
      errorMessage += '---Error---\n\n'
      errorMessage += 'The JSON provided is not valid JSON.\n'
      errorMessage += `Details: ${error.message}\n`
    }

    return errorMessage
  }

  private static _formatZodError(zodError: ZodError): string {
    const issues = zodError.issues
    if (issues.length === 0) {
      return 'Unknown validation error\n'
    }

    let message = ''
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i]
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'

      message += `${i + 1}. Field: "${path}"\n`

      switch (issue.code) {
        case 'invalid_type':
          message += `   Problem: Expected ${issue.expected}, but received ${issue.received}\n`
          message += `   Message: ${issue.message}\n`
          break
        case 'invalid_string':
          if ('validation' in issue) {
            message += `   Problem: Invalid ${issue.validation} format\n`
          }
          message += `   Message: ${issue.message}\n`
          break
        case 'too_small':
          if (issue.type === 'string') {
            if (issue.exact) {
              message += `   Problem: String must be exactly ${issue.minimum} characters\n`
            } else {
              message += `   Problem: String must be at least ${issue.minimum} characters\n`
            }
          } else if (issue.type === 'number') {
            message += `   Problem: Number must be ${issue.inclusive ? 'at least' : 'greater than'} ${issue.minimum}\n`
          } else if (issue.type === 'array') {
            message += `   Problem: Array must contain ${issue.inclusive ? 'at least' : 'more than'} ${issue.minimum} items\n`
          }
          message += `   Message: ${issue.message}\n`
          break
        case 'too_big':
          if (issue.type === 'string') {
            if (issue.exact) {
              message += `   Problem: String must be exactly ${issue.maximum} characters\n`
            } else {
              message += `   Problem: String must be at most ${issue.maximum} characters\n`
            }
          } else if (issue.type === 'number') {
            message += `   Problem: Number must be ${issue.inclusive ? 'at most' : 'less than'} ${issue.maximum}\n`
          } else if (issue.type === 'array') {
            message += `   Problem: Array must contain ${issue.inclusive ? 'at most' : 'fewer than'} ${issue.maximum} items\n`
          }
          message += `   Message: ${issue.message}\n`
          break
        case 'invalid_enum_value':
          message += `   Problem: Invalid value "${issue.received}"\n`
          message += `   Allowed values: ${issue.options.map((o: any) => `"${o}"`).join(', ')}\n`
          message += `   Message: ${issue.message}\n`
          break
        case 'invalid_literal':
          message += `   Problem: Expected the literal value "${issue.expected}", but received "${issue.received}"\n`
          message += `   Message: ${issue.message}\n`
          break
        case 'invalid_union':
          message += "   Problem: Value doesn't match any of the expected formats\n"
          message += `   Message: ${issue.message}\n`
          break
        default:
          message += `   Problem: ${issue.message}\n`
      }

      if (i < issues.length - 1) {
        message += '\n'
      }
    }

    return message
  }
}
