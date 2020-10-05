import { ValidationError } from 'joi'

interface Message {
  code: string
  title: string
  detail: string
}

export class ResponseError {
  messages: Message[]
  statusCode: number

  constructor(messages: Message[], statusCode: number) {
    this.messages = messages
    this.statusCode = statusCode
  }

  static formatValidationError(validation: ValidationError, code: string): Message[] {
    return validation.details.map(detail => {
      return {
        code: code,
        title: detail.type,
        detail: detail.message
      }
    })
  }
}

export class NotFoundError extends ResponseError {
  constructor(resource: string, id?: string, code?: string) {
    super(
      [
        {
          code: code,
          title: 'Not found',
          detail: `${resource} with id ${id} not found.`
        }
      ],
      404
    )
  }
}

export class UnprocessableEntityError extends ResponseError {
  constructor(validation: ValidationError, code?: string) {
    super(UnprocessableEntityError.formatValidationError(validation, code), 422)
  }
}
