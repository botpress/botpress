import { it, describe, expect } from 'vitest'
import { prependPathSegment } from './error-utils'

describe.concurrent('Prepend path segment tests', () => {
  describe.concurrent('prependPathSegment', () => {
    it('formats path section before error message if the section doesnt exist', () => {
      const error = new Error('An error occurred')
      prependPathSegment(error, '.root')
      expect(error.message).toBe('#.root : An error occurred')
    })
    it('adds path segment to error message with existing path section', () => {
      const error = new Error('#.field : An error occurred')
      prependPathSegment(error, '.root')
      expect(error.message).toBe('#.root.field : An error occurred')
    })
  })
})
