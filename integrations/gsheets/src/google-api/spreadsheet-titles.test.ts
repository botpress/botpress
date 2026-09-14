import { describe, it, expect, vi } from 'vitest'
import { resolveSpreadsheetTitles } from './spreadsheet-titles'

describe('resolveSpreadsheetTitles', () => {
  it('maps every spreadsheet to its title', async () => {
    const fetchTitle = vi.fn(async (id: string) => `title of ${id}`)

    await expect(resolveSpreadsheetTitles(['a', 'b'], fetchTitle)).resolves.toEqual({
      a: 'title of a',
      b: 'title of b',
    })
  })

  it('reports an unreachable spreadsheet without failing the others', async () => {
    const fetchTitle = async (id: string) => {
      if (id === 'revoked') {
        throw new Error('403 The caller does not have permission')
      }
      return `title of ${id}`
    }

    await expect(resolveSpreadsheetTitles(['a', 'revoked', 'b'], fetchTitle)).resolves.toEqual({
      a: 'title of a',
      revoked: undefined,
      b: 'title of b',
    })
  })

  it('keeps a spreadsheet that has no title', async () => {
    const fetchTitle = async () => undefined

    await expect(resolveSpreadsheetTitles(['a'], fetchTitle)).resolves.toEqual({ a: undefined })
  })

  it('looks a repeated spreadsheet up only once', async () => {
    const fetchTitle = vi.fn(async (id: string) => `title of ${id}`)

    await expect(resolveSpreadsheetTitles(['a', 'a', 'b'], fetchTitle)).resolves.toEqual({
      a: 'title of a',
      b: 'title of b',
    })
    expect(fetchTitle).toHaveBeenCalledTimes(2)
  })

  it('does nothing when there is no spreadsheet to look up', async () => {
    const fetchTitle = vi.fn(async (id: string) => `title of ${id}`)

    await expect(resolveSpreadsheetTitles([], fetchTitle)).resolves.toEqual({})
    expect(fetchTitle).not.toHaveBeenCalled()
  })
})
