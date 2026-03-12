import { describe, it, expect } from 'vitest'
import {
  MessageRejected,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServiceErrorException,
} from '@aws-sdk/client-sesv2'
import { getErrorMessage } from './error-handler'

describe('getErrorMessage', () => {
  it('should return a user-friendly message for MessageRejected', () => {
    const err = new MessageRejected({ $metadata: {}, message: 'rejected' })
    expect(getErrorMessage(err)).toBe('Message rejected - recipient may have unsubscribed or email suppressed')
  })

  it('should return a user-friendly message for NotFoundException', () => {
    const err = new NotFoundException({ $metadata: {}, message: 'not found' })
    expect(getErrorMessage(err)).toBe('Resource not found (contact list or configuration may not exist)')
  })

  it('should return a user-friendly message for ConflictException', () => {
    const err = new ConflictException({ $metadata: {}, message: 'conflict' })
    expect(getErrorMessage(err)).toBe('Conflict with current state of resource')
  })

  it('should return a user-friendly message for InternalServiceErrorException', () => {
    const err = new InternalServiceErrorException({ $metadata: {}, message: 'internal' })
    expect(getErrorMessage(err)).toBe('Internal AWS service error')
  })

  it('should include the message for BadRequestException', () => {
    const err = new BadRequestException({ $metadata: {}, message: 'invalid param' })
    expect(getErrorMessage(err)).toBe('Invalid request: invalid param')
  })

  it('should return the message for a generic Error', () => {
    const err = new Error('something broke')
    expect(getErrorMessage(err)).toBe('something broke')
  })

  it('should return the string directly if err is a string', () => {
    expect(getErrorMessage('raw error string')).toBe('raw error string')
  })

  it('should extract message from an object with a message property', () => {
    expect(getErrorMessage({ message: 'object error' })).toBe('object error')
  })

  it('should ignore non-string message properties on objects', () => {
    expect(getErrorMessage({ message: 42 })).toBe('An unexpected error occurred')
  })

  it('should return fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred')
  })

  it('should return fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
  })

  it('should return fallback for a number', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred')
  })

  it('should return fallback for an empty object', () => {
    expect(getErrorMessage({})).toBe('An unexpected error occurred')
  })
})
