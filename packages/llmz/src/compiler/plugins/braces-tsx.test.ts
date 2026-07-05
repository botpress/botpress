import { describe, expect, it } from 'vitest'
import { compile } from '../compiler.js'

describe('braces-tsx plugin', () => {
  it('should not treat template literals after a less-than comparison as markdown inline code', () => {
    // Distilled from a real-world failure: the `<` in the reduce flipped the escaper into
    // "inside JSX" mode, and every top-level template literal after it was escaped as inline
    // code — destroying the ${} interpolation. The push inside the if block survived (brace
    // depth), which made the corruption look random.
    const code = `const rows = [
  { day: '07/04', condition: 'overcast', lowC: 18.7, highC: 26.7 },
  { day: '07/05', condition: 'sunny', lowC: 16.1, highC: 24.2 },
]
const coldest = rows.reduce((a, b) => (b.lowC < a.lowC ? b : a))
const parts = []
parts.push(\`Expect **\${rows[0].condition} to \${rows[rows.length - 1].condition}** conditions.\`)
if (rows.length > 0) {
  parts.push(\`Coldest day is \${coldest.day}.\`)
}
parts.push(\`Highs up to \${Math.max(...rows.map((r) => r.highC))}°C.\`)
yield <Message>{parts.join(' ')}</Message>`
    const result = compile(code)
    // The old scanner turned these into inert strings like `Expect **$&#123;rows[0].condition&#125;...`
    expect(result.code).not.toContain('&#123;')
    expect(result.code).not.toContain('&#125;')
    expect(result.code).not.toContain('&gt;')
    expect(result.code).toContain('`Expect **${')
    expect(result.code).toContain('`Coldest day is ${')
    expect(result.code).toContain('`Highs up to ${')
  })

  it('should compile template literals identically regardless of comparison direction', () => {
    const withLt = compile('const c = rows.reduce((a, b) => (b.lowC < a.lowC ? b : a))\nconst s = `Coldest ${c.day}`')
    const withGt = compile('const c = rows.reduce((a, b) => (b.lowC > a.lowC ? b : a))\nconst s = `Coldest ${c.day}`')
    expect(withLt.code).toBe(withGt.code.replace('b.lowC > a.lowC', 'b.lowC < a.lowC'))
  })

  it('should not corrupt template literals after a generic type argument', () => {
    const result = compile('const m: Record<number, string> = {}\nconst s = `first ${m[0]}`')
    expect(result.code).toContain('`first ${m[0]}`')
  })

  it('should still escape braces in fenced code blocks inside JSX text', () => {
    const code = 'yield <Message>\n```ts\nconst o = { foo: 1 }\n```\n</Message>'
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n\`\`\`ts \\nconst o = { foo: 1 } \\n\`\`\` \\n"



        );__comment__("__LLMZ_USER_CODE_END__", 9);

      "
    `)
  })

  it('should still escape inline code inside JSX text', () => {
    const code = 'yield <Message>Use `${bar}` here.</Message>'
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "Use \`\${bar}\` here.");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should not escape a genuine JSX expression in JSX children', () => {
    const result = compile('yield <Message>Hello {user.name}</Message>')
    expect(result.code).toContain('user.name')
    expect(result.code).not.toContain('&#123;')
  })
})
