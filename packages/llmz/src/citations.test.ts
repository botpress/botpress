import { describe, it, expect } from 'vitest'
import { CitationsManager, RARE_SYMBOLS } from './citations.js'

describe('CitationsManager', () => {
  it('should register a source and return a citation', () => {
    const manager = new CitationsManager()
    const source = { type: 'website', url: 'https://example.com' }
    const citation = manager.registerSource(source)

    expect(citation).toBeDefined()
    expect(citation.id).toBe(0)
    expect(citation.source).toEqual(source)
    expect(citation.tag).toBe(`${RARE_SYMBOLS.OPENING_TAG}0${RARE_SYMBOLS.CLOSING_TAG}`)
  })

  it('should increment citation IDs correctly', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'website', url: 'https://example2.com' })

    expect(citation1.id).toBe(0)
    expect(citation2.id).toBe(1)
  })

  it('should extract citations from content and clean it, including offsets', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'book', title: 'Some Book' })

    const content = `This is a test content${citation1.tag} with multiple${citation2.tag} citations.`
    const result = manager.extractCitations(content)

    expect(result.cleaned).toBe('This is a test content with multiple citations.')
    expect(result.citations).toHaveLength(2)
    expect(result.citations).toContainEqual(expect.objectContaining({ ...citation1, offset: 22 }))
    expect(result.citations).toContainEqual(expect.objectContaining({ ...citation2, offset: 39 }))
  })

  it('should handle missing citations gracefully, including offsets', () => {
    const manager = new CitationsManager()
    const content = `This content references a missing citation${RARE_SYMBOLS.OPENING_TAG}99${RARE_SYMBOLS.CLOSING_TAG}.`
    const result = manager.extractCitations(content)

    expect(result.cleaned).toBe('This content references a missing citation.')
    expect(result.citations).toHaveLength(1)
    expect(result.citations[0].source).toBe('Not Found')
    expect(result.citations[0].offset).toBe(42)
  })

  it('should handle multiple citations', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const content = `This content${citation1.tag} references a missing citation${RARE_SYMBOLS.OPENING_TAG}99, 3, 444,1, ${citation2.id}${RARE_SYMBOLS.CLOSING_TAG}.`
    const result = manager.extractCitations(content)

    expect(result.cleaned).toBe('This content references a missing citation.')
    expect(result.citations).toHaveLength(6)
    expect(result.citations[0].source).toBe(citation1.source)
    expect(result.citations[1].source).toBe('Not Found')
    expect(result.citations[2].source).toBe('Not Found')
    expect(result.citations[3].source).toBe('Not Found')
    expect(result.citations[4].id).toBe(citation2.id)
    expect(result.citations[4].source).toBe(citation2.source)
  })

  it('allow changing the replacer', () => {
    const manager = new CitationsManager()
    const replaceFnCalls: unknown[] = []
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'website', url: 'https://example2.com' })
    const content = `This content${citation1.tag} references a missing citation${RARE_SYMBOLS.OPENING_TAG}99, 3, 444, ${citation2.id}${RARE_SYMBOLS.CLOSING_TAG}.`
    const result = manager.extractCitations(content, (citation) => {
      replaceFnCalls.push(citation)
      return `[[${citation.tag}]]`
    })

    expect(result.cleaned).toMatchInlineSnapshot(`"This content[[【0】]] references a missing citation[[【1】]]."`)
    expect(replaceFnCalls).toMatchInlineSnapshot(`
      [
        {
          "id": 0,
          "offset": 12,
          "source": {
            "type": "website",
            "url": "https://example1.com",
          },
          "tag": "【0】",
        },
        {
          "id": 1,
          "offset": 45,
          "source": {
            "type": "website",
            "url": "https://example2.com",
          },
          "tag": "【1】",
        },
      ]
    `)
    expect(result.citations).toHaveLength(5)
    expect(result.citations[0].source).toBe(citation1.source)
    expect(result.citations[1].source).toBe('Not Found')
    expect(result.citations[2].source).toBe('Not Found')
    expect(result.citations[3].source).toBe('Not Found')
    expect(result.citations[4].id).toBe(citation2.id)
    expect(result.citations[4].source).toBe(citation2.source)
  })

  it('should handle content without citations', () => {
    const manager = new CitationsManager()
    const content = 'This content has no citations.'
    const result = manager.extractCitations(content)

    expect(result.cleaned).toBe(content)
    expect(result.citations).toHaveLength(0)
  })

  it('should re-add citations to cleaned content', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'book', title: 'Some Book' })

    const content = `This is a test content${citation1.tag} with multiple${citation2.tag} citations.`
    const extracted = manager.extractCitations(content)
    const result = manager.reAddCitations(extracted.cleaned, extracted.citations)

    expect(result).toBe(content)
  })

  it('should re-add citations (complex)', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'book', title: 'Some Book' })

    const content = `This is a test content: ${citation1.tag} with multiple times this same citation: ${citation1.tag}. Again:${citation1.tag}${citation1.tag}.
Also,
${citation1.tag}
-${citation1.tag};${citation1.tag}.
${citation2}/${citation2}.
-->${citation2}<--`
    const extracted = manager.extractCitations(content)
    const result = manager.reAddCitations(extracted.cleaned, extracted.citations)

    expect(result).toBe(content)
  })

  it('should remove citations from an object deeply and return a new object and paths to citations', () => {
    const manager = new CitationsManager()
    const citation1 = manager.registerSource({ type: 'website', url: 'https://example1.com' })
    const citation2 = manager.registerSource({ type: 'book', title: 'Some Book' })

    const obj = {
      field1: `Some text${citation1.tag} with a citation.`,
      nested: {
        field2: `Another text${citation2.tag} with another citation.`,
      },
      array: [`Array text${citation1.tag}`],
    }

    const [newObj, result] = manager.removeCitationsFromObject(obj)

    expect(newObj).toEqual({
      field1: 'Some text with a citation.',
      nested: {
        field2: 'Another text with another citation.',
      },
      array: ['Array text'],
    })

    expect(result).toHaveLength(3)

    expect(result).toContainEqual(
      expect.objectContaining({ path: 'root.field1', citation: { ...citation1, offset: 9 } })
    )
    expect(result).toContainEqual(
      expect.objectContaining({ path: 'root.nested.field2', citation: { ...citation2, offset: 12 } })
    )
    expect(result).toContainEqual(
      expect.objectContaining({ path: 'root.array.0', citation: { ...citation1, offset: 10 } })
    )
  })

  it('removeTags should remove citation tags from content', () => {
    const tag = (str: string) => `${RARE_SYMBOLS.OPENING_TAG}${str}${RARE_SYMBOLS.CLOSING_TAG}`
    expect(CitationsManager.stripCitationTags(`A ${tag('1')}B C.`)).toBe('A B C.')
    expect(CitationsManager.stripCitationTags(`A ${tag('1')}${tag('2')}${tag('A')}B C.${tag('2345')}`)).toBe('A B C.')
    expect(CitationsManager.stripCitationTags(`A ${tag('1, 2, A, B')}${tag('2')}${tag('A')}B C.${tag('')}`)).toBe(
      'A B C.'
    )
  })
})
