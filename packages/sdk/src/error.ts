abstract class BaseError<Type extends string> extends Error {
  constructor(public readonly type: Type, public override readonly message: string, public readonly error?: Error) {
    super(message)
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
    }
  }
}

type BadRequestType = 'BadRequest'

/**
 *  A bad request error occurred
 */
export class BadRequestError extends BaseError<BadRequestType> {
  constructor(message: string, error?: Error) {
    super('BadRequest', message, error)
  }
}
