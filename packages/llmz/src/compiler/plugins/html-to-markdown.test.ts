import { describe, expect, it } from 'vitest'
import { compile } from '../compiler.js'

describe('html-to-markdown plugin', () => {
  it('should convert strong tags to markdown bold', () => {
    const code = `yield <Message><strong>bold text</strong></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "**bold text**");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert b tags to markdown bold', () => {
    const code = `yield <Message><b>bold text</b></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "**bold text**");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert em tags to markdown italic', () => {
    const code = `yield <Message><em>italic text</em></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "*italic text*");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert i tags to markdown italic', () => {
    const code = `yield <Message><i>italic text</i></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "*italic text*");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert u tags to markdown underline', () => {
    const code = `yield <Message><u>underlined text</u></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "__underlined text__");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert links to markdown links', () => {
    const code = `yield <Message><a href="https://example.com">Click here</a></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "[Click here](https://example.com)");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert br tags to newlines', () => {
    const code = `yield <Message>Line 1<br/>Line 2</Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "Line 1", "\\n", "Line 2");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert p tags to paragraphs with double newline', () => {
    const code = `yield <Message><p>First paragraph</p><p>Second paragraph</p></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "First paragraph \\n \\n", "Second paragraph \\n \\n");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert unordered lists to markdown bullets', () => {
    const code = `yield <Message><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "- Item 1 \\n- Item 2 \\n- Item 3 \\n");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert ordered lists to numbered markdown', () => {
    const code = `yield <Message><ol><li>First</li><li>Second</li><li>Third</li></ol></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "1. First \\n2. Second \\n3. Third \\n");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle mixed formatting', () => {
    const code = `yield <Message>This is <strong>bold</strong> and <em>italic</em> text</Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "This is ", "**bold**", " and ", "*italic*", " text");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle nested formatting', () => {
    const code = `yield <Message><strong>Bold with <em>italic</em> inside</strong></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "**Bold with *italic* inside**");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should NOT convert tags with attributes (except href)', () => {
    const code = `yield <Message><strong className="highlight">text</strong></Message>`
    const result = compile(code)
    // Should NOT be converted to markdown, should remain as JSX
    expect(result.code).toContain('strong')
    expect(result.code).not.toContain('**')
  })

  it('should NOT convert links with multiple attributes', () => {
    const code = `yield <Message><a href="https://example.com" target="_blank">link</a></Message>`
    const result = compile(code)
    // Should NOT be converted
    expect(result.code).toContain('href')
    expect(result.code).not.toContain('[link]')
  })

  it('should convert inner tags even when parent cannot be converted', () => {
    const code = `yield <Message><div><strong>text</strong></div></Message>`
    const result = compile(code)
    // div can't be converted, but strong inside it can be
    expect(result.code).toContain('div')
    expect(result.code).toContain('**text**')
    expect(result.code).not.toContain('strong')
  })

  it('should handle multiple paragraphs in sequence', () => {
    const code = `yield <Message><p>Para 1</p><p>Para 2</p><p>Para 3</p></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "Para 1 \\n \\n", "Para 2 \\n \\n", "Para 3 \\n \\n");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle complex markdown document structure', () => {
    const code = `yield <Message>
<p>Here is a document:</p>
<ul>
  <li>Point <strong>one</strong></li>
  <li>Point <em>two</em></li>
  <li>Point three</li>
</ul>
<p>Visit <a href="https://example.com">our site</a> for more info.</p>
</Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n", "Here is a document: \\n \\n", "\\n", "- Point **one** \\n- Point *two* \\n- Point three \\n", "\\n", (__track__(11), (() => {try {__toolc__(0, "start");const __ret__ =






            __jsx__("p", null, "Visit ", "[our site](https://example.com)", " for more info.");__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n"
        );__comment__("__LLMZ_USER_CODE_END__", 13);

      "
    `)
  })

  it('should convert simple formatting inside list items', () => {
    const code = `yield <Message><ul><li><strong>Bold</strong> item</li><li><em>Italic</em> item</li></ul></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "- **Bold** item \\n- *Italic* item \\n");__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle line breaks within paragraphs', () => {
    const code = `yield <Message><p>Line 1<br/>Line 2<br/>Line 3</p></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("p", null, "Line 1", "\\n", "Line 2", "\\n", "Line 3");__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should preserve HTML with dynamic expressions', () => {
    const code = `yield <Message><strong>{dynamicText}</strong></Message>`
    const result = compile(code)
    // Should NOT convert because of expression
    expect(result.code).toContain('strong')
    expect(result.code).not.toContain('**')
  })

  it('should handle empty tags gracefully', () => {
    const code = `yield <Message><strong></strong><em></em></Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("strong", null);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("em", null);__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should convert real-world example from confusing instructions', () => {
    const code = `yield <Message>
<p>The <strong>product</strong> is available at <a href="https://example.com/product">this link</a></p>
<p>Features:</p>
<ul>
<li>Fast shipping</li>
<li>Money-back guarantee</li>
<li><strong>Premium</strong> quality</li>
</ul>
</Message>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n", (__track__(5), (() => {try {__toolc__(0, "start");const __ret__ =
            __jsx__("p", null, "The ", "**product**", " is available at ", "[this link](https://example.com/product)");__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n", "Features: \\n \\n", "\\n", "- Fast shipping \\n- Money-back guarantee \\n- **Premium** quality \\n", "\\n"






        );__comment__("__LLMZ_USER_CODE_END__", 13);

      "
    `)
  })
})
