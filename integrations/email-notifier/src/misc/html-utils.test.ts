import { describe, it, expect } from 'vitest'
import { escapeHtml } from './html-utils'

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })

  it('should escape less-than signs', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
  })

  it('should escape greater-than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('should escape all special characters in one string', () => {
    expect(escapeHtml('<script>alert("xss" & \'hack\')</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;hack&#39;)&lt;/script&gt;'
    )
  })

  it('should return an empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('should return a string without special characters unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })

  it('should handle multiple consecutive special characters', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;')
  })

  it('should handle unicode characters without escaping them', () => {
    expect(escapeHtml('café & résumé')).toBe('café &amp; résumé')
  })
})
