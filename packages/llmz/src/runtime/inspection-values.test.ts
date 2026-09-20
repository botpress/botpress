import { describe, expect, it } from 'vitest'

import { createInspector } from '../inspection.js'
import { InspectionValues } from './inspection-values.js'

const inspect = createInspector()

describe('iteration inspection policies', () => {
  it('recognizes copied tool values without changing the source', () => {
    const values = new InspectionValues()
    const result = { documents: [{ title: 'Guide', body: 'First line\nSecond line' }] }
    const policy = { maxTokens: 40000, preserve: 'both' as const }
    values.capture(result, policy)

    expect(values.getPolicy(structuredClone(result))).toEqual(policy)
    expect(values.getPolicy(result.documents[0]?.title)).toBeUndefined()
    expect(result).toEqual({ documents: [{ title: 'Guide', body: 'First line\nSecond line' }] })
  })

  it('keeps the strictest explicit cap for identical values', () => {
    const values = new InspectionValues()
    const first = { maxTokens: 1000, preserve: 'top' as const }
    const strictest = { maxTokens: 100, preserve: 'bottom' as const }

    for (const value of ['same text', { account: 42 }]) {
      values.capture(value, first)
      values.capture(structuredClone(value), strictest)
      values.capture(structuredClone(value), first)

      expect(values.getPolicy(value)).toEqual(strictest)
    }
  })

  it('retains explicit zero-token policies for primitive results', () => {
    const values = new InspectionValues()
    const policy = { maxTokens: 0, preserve: 'top' as const }

    for (const value of [42, true, false, null, undefined]) {
      values.capture(value, policy)
      values.capture(value, { maxTokens: 100, preserve: 'bottom' })

      expect(values.getPolicy(value)).toEqual(policy)
    }
  })

  it('resolves equal-cap preservation conflicts independently of completion order', () => {
    const bottom = { maxTokens: 100, preserve: 'bottom' as const }
    const both = { maxTokens: 100, preserve: 'both' as const }

    for (const policies of [
      [bottom, both],
      [both, bottom],
    ]) {
      const values = new InspectionValues()

      for (const policy of policies) {
        values.capture('same text', policy)
      }

      expect(values.getPolicy('same text')).toEqual({ maxTokens: 100, preserve: 'top' })
    }
  })

  it('does not turn unsupported display metadata into a failed business call', () => {
    const values = new InspectionValues()
    const policy = { maxTokens: 100, preserve: 'top' as const }
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic

    expect(() => values.capture(new Date(), policy)).not.toThrow()
    expect(() => values.capture(cyclic, policy)).not.toThrow()
    expect(() => values.capture(() => 42, policy)).not.toThrow()
    expect(values.getPolicy('unrelated result')).toBeUndefined()
  })

  it('does not apply policies to modified values or later executions', () => {
    const values = new InspectionValues()
    const result = { records: ['original'] }
    const policy = { maxTokens: 20, preserve: 'top' as const }
    values.capture(result, policy)
    values.capture('original text', policy)
    result.records.push('added')

    expect(values.getPolicy(result)).toBeUndefined()
    expect(values.getPolicy('original text with added details')).toBeUndefined()
    expect(values.getPolicy({ records: ['original'] })).toEqual(policy)
    expect(new InspectionValues().getPolicy({ records: ['original'] })).toBeUndefined()
  })

  it('renders nested budgets directly without inserting wrappers into the inspected data', () => {
    const values = new InspectionValues()
    const rag = 'RAG_START ' + 'evidence '.repeat(4000) + ' RAG_END'
    const ordinary = 'PLAIN_START ' + 'ordinary '.repeat(4000) + ' PLAIN_END'
    values.capture(rag, { maxTokens: 10000, preserve: 'both' })
    values.captureDefault(rag, 64)
    values.captureDefault(ordinary, 64)
    const value = { results: [rag, ordinary] }
    const output = inspect(value, { purpose: 'result', maxTokens: 64, policies: values.getPolicy })

    expect(output).toContain('RAG_END')
    expect(output).not.toContain('PLAIN_END')
    expect(output).not.toContain('$$truncate')
    expect(value).toEqual({ results: [rag, ordinary] })
  })

  it('lets explicit policies override defaults independently of capture order', () => {
    const policy = { maxTokens: 1000, preserve: 'bottom' as const }

    for (const explicitFirst of [false, true]) {
      for (const value of ['same text', { body: 'same text' }]) {
        const values = new InspectionValues()

        if (explicitFirst) {
          values.capture(value, policy)
        }

        values.captureDefault(value, 1)

        if (!explicitFirst) {
          values.capture(value, policy)
        }

        expect(values.getPolicy(value)).toEqual(policy)
      }
    }
  })
})
