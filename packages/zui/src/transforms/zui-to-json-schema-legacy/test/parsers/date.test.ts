import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseDateDef } from '../../parsers/date'
import { getRefs } from '../../Refs'
import { errorReferences } from './errorReferences'

describe('Number validations', () => {
  it('should be possible to date as a string type', () => {
    const zodDateSchema = z.date()
    const parsedSchemaWithOption = parseDateDef(zodDateSchema._def, getRefs({ dateStrategy: 'string' }))
    const parsedSchemaFromDefault = parseDateDef(zodDateSchema._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      type: 'string',
      format: 'date-time',
    }

    expect(parsedSchemaWithOption).toEqual(jsonSchema)
    expect(parsedSchemaFromDefault).toEqual(jsonSchema)
  })

  it('should be possible to describe minimum date', () => {
    const zodDateSchema = z.date().min(new Date('1970-01-02'), { message: 'Too old' })
    const parsedSchema = parseDateDef(zodDateSchema._def, getRefs({ dateStrategy: 'integer' }))

    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      format: 'unix-time',
      minimum: 86400000,
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to describe maximum date', () => {
    const zodDateSchema = z.date().max(new Date('1970-01-02'))
    const parsedSchema = parseDateDef(zodDateSchema._def, getRefs({ dateStrategy: 'integer' }))

    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      format: 'unix-time',
      maximum: 86400000,
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to describe both maximum and minimum date', () => {
    const zodDateSchema = z.date().min(new Date('1970-01-02')).max(new Date('1972-01-02'))
    const parsedSchema = parseDateDef(zodDateSchema._def, getRefs({ dateStrategy: 'integer' }))

    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      format: 'unix-time',
      minimum: 86400000,
      maximum: 63158400000,
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it("should include custom error message for both maximum and minimum if they're passed", () => {
    const minimumErrorMessage = 'To young'
    const maximumErrorMessage = 'To old'
    const zodDateSchema = z
      .date()
      .min(new Date('1970-01-02'), minimumErrorMessage)
      .max(new Date('1972-01-02'), maximumErrorMessage)

    const parsedSchema = parseDateDef(zodDateSchema._def, errorReferences({ dateStrategy: 'integer' }))

    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      format: 'unix-time',
      minimum: 86400000,
      maximum: 63158400000,
      errorMessage: {
        minimum: minimumErrorMessage,
        maximum: maximumErrorMessage,
      },
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })
})
