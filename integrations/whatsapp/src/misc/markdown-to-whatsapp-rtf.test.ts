import { describe, it, expect, test } from 'vitest'
import { convertMarkdownToWhatsApp } from './markdown-to-whatsapp-rtf'

describe('WhatsApp Markdown Converter', () => {
  describe('Basic Formatting', () => {
    it('should convert bold text correctly', () => {
      expect(convertMarkdownToWhatsApp('**bold text**')).toBe('*bold text*')
      expect(convertMarkdownToWhatsApp('__bold text__')).toBe('*bold text*')
    })

    it('should convert italic text correctly', () => {
      expect(convertMarkdownToWhatsApp('*italic text*')).toBe('_italic text_')
      expect(convertMarkdownToWhatsApp('_italic text_')).toBe('_italic text_')
    })

    it('should convert strikethrough text correctly', () => {
      expect(convertMarkdownToWhatsApp('~~strikethrough~~')).toBe('~strikethrough~')
    })

    it('should leave inline code unmodified', () => {
      expect(convertMarkdownToWhatsApp('`inline code`')).toBe('`inline code`')
    })

    it('should handle mixed formatting in same paragraph', () => {
      const input = 'This is **bold** and *italic* and `code`.'
      const expected = 'This is *bold* and _italic_ and `code`.'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert bold and italic text in bullet points', () => {
      const input = '* **bold**\n* *italic*'
      const expected = '- *bold*\n- _italic_'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Complex Nested Formatting', () => {
    it('should handle bold with italic inside', () => {
      const input = '**bold _italic_ text**'
      const expected = '*bold _italic_ text*'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle italic with bold inside', () => {
      const input = '*italic **bold** text*'
      const expected = '_italic *bold* text_'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle code with formatting inside (should preserve as-is)', () => {
      const input = '`code **bold** text`'
      const expected = '`code **bold** text`'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle strikethrough with nested formatting', () => {
      const input = '~~deleted **bold** text~~'
      const expected = '~deleted *bold* text~'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Headers', () => {
    it('should convert H1 to bold', () => {
      expect(convertMarkdownToWhatsApp('# Header 1')).toBe('*Header 1*')
    })

    it('should convert H2 to bold', () => {
      expect(convertMarkdownToWhatsApp('## Header 2')).toBe('*Header 2*')
    })

    it('should convert H6 to bold', () => {
      expect(convertMarkdownToWhatsApp('###### Header 6')).toBe('*Header 6*')
    })

    it('should convert headers with underlines to bold', () => {
      expect(convertMarkdownToWhatsApp('Header 1\n===')).toBe('*Header 1*')
      expect(convertMarkdownToWhatsApp('Header 1\n---')).toBe('*Header 1*')
    })

    it('should convert headers with formatting inside (skip bold)', () => {
      const input = '# Header with **bold**, *italic*, `code`, **_bolditalic_** text'
      const expected = '*Header with bold, _italic_, `code`, _bolditalic_ text*'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Code Blocks', () => {
    it('should convert code blocks correctly', () => {
      const input = '```javascript\nfunction test() {\n  return true;\n}\n```'
      const expected = '```function test() {\n  return true;\n}```'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle code blocks without language specification', () => {
      const input = '```\nsome code\n```'
      const expected = '```some code```'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Links and Images', () => {
    it('should convert links to text with URL', () => {
      const input = '[Google](https://google.com)'
      const expected = 'Google (https://google.com)'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert images with alt text', () => {
      const input = '![Alt text](https://example.com/image.jpg)'
      const expected = 'Image: Alt text (https://example.com/image.jpg)'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert images without alt text', () => {
      const input = '![](https://example.com/image.jpg)'
      const expected = 'https://example.com/image.jpg'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert links with formatted text', () => {
      const input = '[**Bold link**](https://example.com)'
      const expected = '*Bold link* (https://example.com)'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert autolinks', () => {
      expect(convertMarkdownToWhatsApp('<https://example.com>')).toBe('https://example.com')
    })

    it('should convert email autolinks', () => {
      expect(convertMarkdownToWhatsApp('<test@test.com>')).toBe('test@test.com (mailto:test@test.com)')
    })

    it('should not convert normal email text to link', () => {
      expect(convertMarkdownToWhatsApp('test@test.com')).toBe('test@test.com')
    })

    it('should convert links with title', () => {
      const input = '[Link with title](https://example.com "Title")'
      const expected = 'Link with title (https://example.com)'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert reference links', () => {
      const input = '[Google][1]\n\n[1]: https://google.com'
      const expected = 'Google (https://google.com)'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Tables', () => {
    it('should preserve tables as is', () => {
      const input = '| Header 1 | Header 2 |\n|----------|----------|\n| Row 1    | Row 2    |'
      const expected = `${input}`
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Lists', () => {
    it('should convert unordered lists', () => {
      const input = '- Item 1\n- Item 2\n- Item 3'
      const expected = '- Item 1\n- Item 2\n- Item 3'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert ordered lists', () => {
      const input = '1. First item\n2. Second item\n3. Third item'
      const expected = '1. First item\n2. Second item\n3. Third item'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it("should convert ordered lists that don't increment indexes", () => {
      const input = '1. First item\n1. Second item\n1. Third item'
      const expected = '1. First item\n2. Second item\n3. Third item'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle nested lists', () => {
      const input =
        '- Item 1\n  - Nested item\n- Item 2\n  - Next nested item\n    - Double nested item\n      - Triple nested item\n        - Quadruple nested item'
      const expected =
        '- Item 1\n\u2002\u2002◦ Nested item\n- Item 2\n\u2002\u2002◦ Next nested item\n\u2002\u2002\u2002\u2002➤ Double nested item\n\u2002\u2002\u2002\u2002\u2002\u2002✦ Triple nested item\n\u2002\u2002\u2002\u2002\u2002\u2002\u2002\u2002• Quadruple nested item'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle list items with formatting', () => {
      const input = '- **Bold item**\n- *Italic item*\n- `Code item`'
      const expected = '- *Bold item*\n- _Italic item_\n- `Code item`'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should convert task lists', () => {
      const input = '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3'
      const expected = '☐ Task 1\n☑ Task 2\n☐ Task 3'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Blockquotes', () => {
    it('should convert simple blockquotes', () => {
      const input = '> This is a quote'
      const expected = '> This is a quote'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle multi-line blockquotes', () => {
      const input = '> Line 1\n> Line 2\n> Line 3'
      const expected = '> Line 1\n> Line 2\n> Line 3'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle blockquotes with formatting', () => {
      const input = '> This is **bold** in quote'
      const expected = '> This is *bold* in quote'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle nested blockquotes', () => {
      const input = '> Outer quote\n>> Inner quote'
      const expected = '> Outer quote\n> » Inner quote'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Horizontal Rules', () => {
    it('should convert horizontal rules', () => {
      expect(convertMarkdownToWhatsApp('---')).toBe('---')
      expect(convertMarkdownToWhatsApp('***')).toBe('---')
      expect(convertMarkdownToWhatsApp('___')).toBe('---')
    })
  })

  describe('HTML Handling', () => {
    it('should strip inline HTML tags', () => {
      const input = 'Text with <strong>HTML</strong> tags'
      const expected = 'Text with HTML tags'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should strip block HTML tags', () => {
      const input = '<div>\nText in a div\n</div>'
      const expected = 'Text in a div'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle HTML entities', () => {
      const input = 'Text with &amp; entities'
      const expected = 'Text with &amp; entities'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      expect(convertMarkdownToWhatsApp('')).toBe('')
    })

    it('should handle plain text without formatting', () => {
      const input = 'Just plain text here.'
      const expected = 'Just plain text here.'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle escaped characters', () => {
      const input = 'This \\*should\\* not be bold'
      const expected = 'This *should* not be bold'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should handle multiple paragraphs', () => {
      const input = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
      const expected = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
      expect(convertMarkdownToWhatsApp(input)).toBe(expected)
    })

    it('should clean up excessive newlines', () => {
      const input = 'Text 1\n\n\n\nText 2'
      const result = convertMarkdownToWhatsApp(input)
      // Should not have more than 2 consecutive newlines
      expect(result).not.toMatch(/\n{3,}/)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complex real-world markdown', () => {
      const input = `# Project README

  This is a **sample project** with _various_ formatting.

  ## Features

  - ~~Deprecated~~ New feature
  - \`Code integration\`
  - [Documentation](https://docs.example.com)

  \`\`\`javascript
  function hello() {
    console.log("Hello World!");
  }
  \`\`\`

  > Important: This is a **critical** *note*!
  > > The note in question

  - project a
    - phase 1
      - [ ] Task 1
      - [x] Task 2

  ---

  For more info, visit our ![logo](logo.png) [website](https://example.com).`

      const result = convertMarkdownToWhatsApp(input)

      // Check that all major elements are converted
      expect(result).toContain('*Project README*')
      expect(result).toContain('*Features*')
      expect(result).toContain('*sample project*')
      expect(result).toContain('_various_')
      expect(result).toContain('~Deprecated~')
      expect(result).toContain('`Code integration`')
      expect(result).toContain('Documentation (https://docs.example.com)')
      expect(result).toContain('```function hello()')
      expect(result).toContain('> Important: This is a *critical* _note_!')
      expect(result).toContain('> » The note in question')
      expect(result).toContain('- project a')
      expect(result).toContain('\u2002\u2002◦ phase 1')
      expect(result).toContain('\u2002\u2002\u2002\u2002☐ Task 1')
      expect(result).toContain('\u2002\u2002\u2002\u2002☑ Task 2')
      expect(result).toContain('---')
      expect(result).toContain('Image: logo (logo.png)')
      expect(result).toContain('website (https://example.com)')
    })
  })

  // Regression tests for specific bugs
  describe('Regression Tests', () => {
    it('should not double-convert already converted formatting', () => {
      const input = '*already italic* and **already bold**'
      const result = convertMarkdownToWhatsApp(input)
      expect(result).toBe('_already italic_ and *already bold*')
    })

    it('should handle adjacent formatting correctly', () => {
      const input = '**bold**_italic_`code`'
      const result = convertMarkdownToWhatsApp(input)
      expect(result).toBe('*bold*_italic_`code`')
    })

    it('should preserve whitespace in code blocks', () => {
      const input = '```\n  indented code\n    more indent\n```'
      const result = convertMarkdownToWhatsApp(input)
      expect(result).toContain('  indented code')
      expect(result).toContain('    more indent')
    })
  })
})
