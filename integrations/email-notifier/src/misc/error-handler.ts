import {
  MessageRejected,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServiceErrorException,
} from '@aws-sdk/client-sesv2'

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof MessageRejected) {
    return 'Message rejected - recipient may have unsubscribed or email suppressed'
  }

  if (err instanceof NotFoundException) {
    return 'Resource not found (contact list or configuration may not exist)'
  }

  if (err instanceof ConflictException) {
    return 'Conflict with current state of resource'
  }

  if (err instanceof InternalServiceErrorException) {
    return 'Internal AWS service error'
  }

  if (err instanceof BadRequestException) {
    return `Invalid request: ${err.message}`
  }

  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return 'An unexpected error occurred'
}
