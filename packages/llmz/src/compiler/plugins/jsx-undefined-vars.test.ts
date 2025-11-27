import { describe, expect, it } from 'vitest'
import { compile } from '../compiler.js'

describe('jsx-undefined-vars plugin', () => {
  it('should wrap undefined variable references in JSX expressions', () => {
    const code = `yield <div>{content}</div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = (() => {try {return content;} catch {return "content";}})();__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle multiple undefined variables in same JSX element', () => {
    const code = `yield <div><p>{title}</p><p>{content}</p><p>{author}</p></div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("p", null, (() => {try {return title;} catch {return "title";}})());__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("p", null, (() => {try {return content;} catch {return "content";}})());__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(2, "start");const __ret__ = __jsx__("p", null, (() => {try {return author;} catch {return "author";}})());__toolc__(2, "end", __ret__);return __ret__;} catch (err) {__toolc__(2, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should not wrap known global identifiers like console and Math', () => {
    const code = `yield <div>{console}{Math}</div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, console, Math);__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should not wrap member expressions', () => {
    const code = `const obj = { name: 'test' }; yield <div>{obj.name}</div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        const obj = { name: 'test' };__var__("obj", () => eval("obj"));yield __jsx__("div", null, obj.name);__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should not wrap function calls', () => {
    const code = `function getName() { return 'test' }; yield <div>{getName()}</div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        function getName() {return 'test';};yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = getName();__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle variables in nested JSX', () => {
    const code = `yield <div><header><h1>{title}</h1></header><main><p>{content}</p></main></div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("header", null, __jsx__("h1", null, (() => {try {return title;} catch {return "title";}})()));__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("main", null, __jsx__("p", null, (() => {try {return content;} catch {return "content";}})()));__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle variables in JSX attributes', () => {
    const code = `yield <div className={theme}><a href={link}>Click</a></div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", { className: (() => {try {__toolc__(0, "start");const __ret__ = (() => {try {return theme;} catch {return "theme";}})();__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})() }, (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("a", { href: (() => {try {return link;} catch {return "link";}})() }, "Click");__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle complex HTML entity scenarios from confusing instructions', () => {
    const code = `yield <div><code>{content}</code><p>{template}</p></div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("code", null, (() => {try {return content;} catch {return "content";}})());__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("p", null, (() => {try {return template;} catch {return "template";}})());__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle JSX with curly brace patterns and label variable', () => {
    const code = `yield <div><pre>{label}</pre></div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("div", null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("pre", null, (() => {try {return label;} catch {return "label";}})());__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle spread in JSX', () => {
    const code = `const props = { className: 'test' }; yield <div {...props}>{content}</div>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        const props = { className: 'test' };__var__("props", () => eval("props"));yield __jsx__("div", props, (() => {try {__toolc__(0, "start");const __ret__ = (() => {try {return content;} catch {return "content";}})();__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle JSX fragments with undefined variables', () => {
    const code = `yield <><div>{title}</div><div>{content}</div></>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__(React.Fragment, null, (() => {try {__toolc__(0, "start");const __ret__ = __jsx__("div", null, (() => {try {return title;} catch {return "title";}})());__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})(), (() => {try {__toolc__(1, "start");const __ret__ = __jsx__("div", null, (() => {try {return content;} catch {return "content";}})());__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })

  it('should handle undefined variables in inline callback expressions', () => {
    const code = `yield <button onClick={() => alert(message)}>{buttonText}</button>`
    const result = compile(code)
    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("button", { onClick: () => (() => {try {__toolc__(0, "start");const __ret__ = alert(message);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})() }, (() => {try {__toolc__(1, "start");const __ret__ = (() => {try {return buttonText;} catch {return "buttonText";}})();__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 5);

      "
    `)
  })
})
