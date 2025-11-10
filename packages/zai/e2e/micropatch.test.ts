import { test, expect, describe } from 'vitest'
import { Micropatch } from '../src/micropatch'

describe('Micropatch', () => {
  describe('EOL detection', () => {
    test('detects LF', () => {
      expect(Micropatch.detectEOL('line1\nline2\n')).toBe('lf')
    })

    test('detects CRLF', () => {
      expect(Micropatch.detectEOL('line1\r\nline2\r\n')).toBe('crlf')
    })

    test('defaults to LF when no line breaks', () => {
      expect(Micropatch.detectEOL('single line')).toBe('lf')
    })
  })

  describe('Delete operations', () => {
    test('deletes single line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎-2'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line3
"
`)
    })

    test('deletes range of lines', () => {
      const source = 'line1\nline2\nline3\nline4\nline5\n'
      const ops = '◼︎-2-4'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line5
"
`)
    })

    test('deletes multiple non-contiguous lines', () => {
      const source = 'line1\nline2\nline3\nline4\n'
      const ops = '◼︎-2\n◼︎-4'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line3
"
`)
    })

    test('deletes first line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎-1'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line2
line3
"
`)
    })

    test('deletes last line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎-3'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line2
"
`)
    })
  })

  describe('Replace operations', () => {
    test('replaces single line with single line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎=2|REPLACED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
REPLACED
line3
"
`)
    })

    test('replaces single line with multiple lines', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎=2|REPLACED1\nREPLACED2\nREPLACED3'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
REPLACED1
REPLACED2
REPLACED3
line3
"
`)
    })

    test('replaces range with single line', () => {
      const source = 'line1\nline2\nline3\nline4\n'
      const ops = '◼︎=2-3|REPLACED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
REPLACED
line4
"
`)
    })

    test('replaces range with multiple lines', () => {
      const source = 'line1\nline2\nline3\nline4\n'
      const ops = '◼︎=2-3|NEW1\nNEW2'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
NEW1
NEW2
line4
"
`)
    })

    test('replaces empty payload', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎=2|'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1

line3
"
`)
    })
  })

  describe('Insert operations', () => {
    test('inserts before line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎<2|INSERTED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
INSERTED
line2
line3
"
`)
    })

    test('inserts after line', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎>2|INSERTED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line2
INSERTED
line3
"
`)
    })

    test('inserts before first line', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎<1|FIRST'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"FIRST
line1
line2
"
`)
    })

    test('inserts after last line', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎>2|LAST'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line2
LAST
"
`)
    })

    test('multiple inserts at same position', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎>1|INSERT1\n◼︎>1|INSERT2'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
INSERT2
INSERT1
line2
line3
"
`)
    })
  })

  describe('Complex multi-operation patches', () => {
    test('combines delete, replace, and insert', () => {
      const source = 'line1\nline2\nline3\nline4\nline5\n'
      const ops = `◼︎-3
◼︎=2|REPLACED
◼︎>4|INSERTED`
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
REPLACED
line4
INSERTED
line5
"
`)
    })

    test('operations maintain original line references', () => {
      const source = 'A\nB\nC\nD\nE\n'
      // Delete B (line 2), then insert after original C (line 3)
      // After delete: A, C, D, E
      // Insert after original C should still work
      const ops = '◼︎-2\n◼︎>3|X'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"A
C
X
D
E
"
`)
    })
  })

  describe('Multiline payloads', () => {
    test('handles multiline replace with embedded marker escape', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎=2|This has \\◼︎ marker\nSecond line\nThird line'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
This has ◼︎ marker
Second line
Third line
line3
"
`)
    })

    test('multiline payload ends at next op marker', () => {
      const source = 'line1\nline2\nline3\nline4\n'
      const ops = `◼︎=2|MULTI1
MULTI2
◼︎=4|REPLACED`
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
MULTI1
MULTI2
line3
REPLACED
"
`)
    })
  })

  describe('EOL handling', () => {
    test('preserves CRLF line endings', () => {
      const source = 'line1\r\nline2\r\nline3\r\n'
      const ops = '◼︎=2|REPLACED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toBe('line1\r\nREPLACED\r\nline3\r\n')
    })

    test('uses specified EOL style', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '◼︎=2|REPLACED'
      const result = Micropatch.applyText(source, ops, 'crlf')
      expect(result).toBe('line1\r\nREPLACED\r\nline3\r\n')
    })

    test('can switch EOL style', () => {
      const source = 'line1\r\nline2\r\nline3\r\n'
      const ops = '◼︎=2|REPLACED'
      const result = Micropatch.applyText(source, ops, 'lf')
      expect(result).toBe('line1\nREPLACED\nline3\n')
    })
  })

  describe('Micropatch instance methods', () => {
    test('getText returns current text', () => {
      const mp = new Micropatch('line1\nline2\n')
      expect(mp.getText()).toBe('line1\nline2\n')
    })

    test('setText updates text', () => {
      const mp = new Micropatch('line1\nline2\n')
      mp.setText('new1\nnew2\n')
      expect(mp.getText()).toBe('new1\nnew2\n')
    })

    test('apply updates internal text', () => {
      const mp = new Micropatch('line1\nline2\nline3\n')
      mp.apply('◼︎=2|REPLACED')
      expect(mp.getText()).toBe('line1\nREPLACED\nline3\n')
    })

    test('can apply multiple patches sequentially', () => {
      const mp = new Micropatch('line1\nline2\nline3\n')
      mp.apply('◼︎=2|REPLACED')
      mp.apply('◼︎-3')
      expect(mp.getText()).toBe('line1\nREPLACED\n')
    })

    test('renderNumberedView shows line numbers', () => {
      const mp = new Micropatch('line1\nline2\nline3\n')
      const view = mp.renderNumberedView()
      expect(view).toMatchInlineSnapshot(`
"001|line1
002|line2
003|line3
004|"
`)
    })
  })

  describe('Validation', () => {
    test('validate returns ok and count', () => {
      const ops = '◼︎-1\n◼︎=2|X\n◼︎>3|Y'
      const result = Micropatch.validate(ops)
      expect(result.ok).toBe(true)
      expect(result.count).toBe(3)
    })

    test('validate ignores non-op lines', () => {
      const ops = '# comment\n◼︎-1\n\n◼︎=2|X'
      const result = Micropatch.validate(ops)
      expect(result.ok).toBe(true)
      expect(result.count).toBe(2)
    })
  })

  describe('Error handling', () => {
    test('throws on invalid op syntax', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎INVALID'
      expect(() => Micropatch.applyText(source, ops)).toThrow('Invalid op syntax')
    })

    test('throws on range for insert', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎<1-2|X'
      expect(() => Micropatch.applyText(source, ops)).toThrow('Insert cannot target a range')
    })

    test('throws on delete with payload', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎-1|INVALID'
      expect(() => Micropatch.applyText(source, ops)).toThrow('Delete must not have a payload')
    })

    test('throws on invalid line number', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎-0'
      expect(() => Micropatch.applyText(source, ops)).toThrow('Invalid line/range')
    })

    test('throws on invalid range', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎-3-2'
      expect(() => Micropatch.applyText(source, ops)).toThrow('Invalid line/range')
    })
  })

  describe('Edge cases', () => {
    test('handles empty source', () => {
      const source = ''
      const ops = '◼︎<1|NEW'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"NEW
"
`)
    })

    test('handles single line source', () => {
      const source = 'line1'
      const ops = '◼︎=1|REPLACED'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`"REPLACED"`)
    })

    test('skips ops targeting non-existent lines', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎-1\n◼︎-1' // Try to delete line 1 twice
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line2
"
`)
    })

    test('handles empty op text', () => {
      const source = 'line1\nline2\n'
      const ops = ''
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
line2
"
`)
    })

    test('handles blank lines in ops', () => {
      const source = 'line1\nline2\nline3\n'
      const ops = '\n\n◼︎=2|REPLACED\n\n'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
REPLACED
line3
"
`)
    })
  })

  describe('Operation order', () => {
    test('applies deletes before replaces', () => {
      const source = 'A\nB\nC\nD\n'
      // Delete C (line 3), replace B (line 2)
      // Should delete first, then replace
      const ops = '◼︎=2|X\n◼︎-3'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"A
X
D
"
`)
    })

    test('applies replaces before inserts', () => {
      const source = 'A\nB\nC\n'
      // Insert after B (line 2), replace B (line 2)
      // Should replace first, then insert
      const ops = '◼︎>2|Y\n◼︎=2|X'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"A
X
Y
C
"
`)
    })

    test('applies < inserts before > inserts', () => {
      const source = 'A\nB\n'
      // <2 is processed before >1 per operation order
      const ops = '◼︎>1|AFTER\n◼︎<2|BEFORE'
      const result = Micropatch.applyText(source, ops)
      // < ops go first (BEFORE at line 2), then > ops (AFTER after line 1)
      expect(result).toMatchInlineSnapshot(`
"A
AFTER
BEFORE
B
"
`)
    })
  })

  describe('Escaping', () => {
    test('unescapes marker in insert', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎>1|Text with \\◼︎ marker'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
Text with ◼︎ marker
line2
"
`)
    })

    test('unescapes marker in replace', () => {
      const source = 'line1\nline2\n'
      const ops = '◼︎=2|Escaped \\◼︎ here'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"line1
Escaped ◼︎ here
"
`)
    })

    test('multiple escaped markers', () => {
      const source = 'line1\n'
      const ops = '◼︎=1|\\◼︎ start \\◼︎ middle \\◼︎ end'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"◼︎ start ◼︎ middle ◼︎ end
"
`)
    })

    test('no other escape sequences', () => {
      const source = 'line1\n'
      const ops = '◼︎=1|\\n \\t \\r stay literal'
      const result = Micropatch.applyText(source, ops)
      expect(result).toMatchInlineSnapshot(`
"\\n \\t \\r stay literal
"
`)
    })
  })
})
