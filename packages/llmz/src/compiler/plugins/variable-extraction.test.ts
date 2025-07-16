import * as Babel from '@babel/standalone'
import { describe, expect, it, beforeEach } from 'vitest'

import { variableTrackingPlugin } from './variable-extraction.js'
import { DEFAULT_TRANSFORM_OPTIONS } from '../compiler.js'
import { formatTypings } from '../../formatting.js'

const variables = new Set<string>()
function transform(original: string) {
  const { code } = Babel.transform(original, {
    ...DEFAULT_TRANSFORM_OPTIONS,
    plugins: [variableTrackingPlugin(variables)],
  })

  return formatTypings(code!, {
    semi: true,
  })
}

describe('variableExtractionBabelPlugin', () => {
  beforeEach(() => {
    variables.clear()
  })

  it('Basic tracking', async () => {
    const code = `
      const a = 10;
      let x = 5;
      x += a;
      var y = await getNumber({ a, x });
      console.log(y, x, a);
      // x, y, a
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const a = 10;
      __var__("a", () => eval("a"));
      let x = 5;
      __var__("x", () => eval("x"));
      x += a;
      var y = await getNumber({ a, x });
      __var__("y", () => eval("y"));
      console.log(y, x, a);
      // x, y, a"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "x",
        "y",
      ]
    `)
  })

  it('Object destructuring', async () => {
    const code = `
      const { a, b } = { a: 1, b: 2 };
      console.log(a, b);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const { a, b } = { a: 1, b: 2 };
      __var__("a", () => eval("a"));
      __var__("b", () => eval("b"));
      console.log(a, b);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('Array destructuring', async () => {
    const code = `
      const [ a, b ] = [ 1, 2 ];
      console.log(a, b);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const [a, b] = [1, 2];
      __var__("a", () => eval("a"));
      __var__("b", () => eval("b"));
      console.log(a, b);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('skips declarations inside for loops', async () => {
    const code = `
      for (const { a, b } of [{ a: 1, b: 2 }]) {
        console.log(a, b);
      }
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "for (const { a, b } of [{ a: 1, b: 2 }]) {
        console.log(a, b);
      }"
    `)

    expect([...variables]).toMatchInlineSnapshot(`[]`)
  })

  it('skips declarations inside for loops (2)', async () => {
    const code = `
      for (let i = 0; i < 10; i++) {
        console.log(a, b);
      }
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "for (let i = 0; i < 10; i++) {
        console.log(a, b);
      }"
    `)

    expect([...variables]).toMatchInlineSnapshot(`[]`)
  })

  it('Nested object destructuring', async () => {
    const code = `
      const { a, b: { c, d } } = { a: 1, b: { c: 2, d: 3 } };
      console.log(a, c, d);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const {
        a,
        b: { c, d },
      } = { a: 1, b: { c: 2, d: 3 } };
      __var__("a", () => eval("a"));
      __var__("c", () => eval("c"));
      __var__("d", () => eval("d"));
      console.log(a, c, d);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "c",
        "d",
      ]
    `)
  })

  it('Object destructuring with default values', async () => {
    const code = `
      const { a = 1, b = 2 } = {};
      console.log(a, b);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const { a = 1, b = 2 } = {};
      __var__("a", () => eval("a"));
      __var__("b", () => eval("b"));
      console.log(a, b);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('Array destructuring with rest elements', async () => {
    const code = `
      const [a, ...rest] = [1, 2, 3];
      console.log(a, rest);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const [a, ...rest] = [1, 2, 3];
      __var__("a", () => eval("a"));
      __var__("rest", () => eval("rest"));
      console.log(a, rest);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "rest",
      ]
    `)
  })

  it('Array destructuring with default values', async () => {
    const code = `
      const [a = 1, b = 2] = [];
      console.log(a, b);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const [a = 1, b = 2] = [];
      __var__("a", () => eval("a"));
      __var__("b", () => eval("b"));
      console.log(a, b);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('Variable declarations in block scope', async () => {
    const code = `
      if (true) {
        const a = 1;
        let b = 2;
        var c = 3;
        console.log(a, b, c);
      }
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "if (true) {
        const a = 1;
        __var__("a", () => eval("a"));
        let b = 2;
        __var__("b", () => eval("b"));
        var c = 3;
        __var__("c", () => eval("c"));
        console.log(a, b, c);
      }"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
        "c",
      ]
    `)
  })

  it('Function parameters', async () => {
    const code = `
      function foo(a, b) {
        console.log(a, b);
      }
      foo(1, 2);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "function foo(a, b) {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        console.log(a, b);
      }
      foo(1, 2);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('Default function parameters', async () => {
    const code = `
      function foo(a = 1, b = 2) {
        console.log(a, b);
      }
      foo();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "function foo(a = 1, b = 2) {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        console.log(a, b);
      }
      foo();"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('Arrow functions', async () => {
    const code = `
      const foo = (a, b) => {
        console.log(a, b);
      };
      foo(1, 2);
      const bar = (a, b) => {
        return a + b;
      };
      bar(3, 4);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const foo = (a, b) => {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        console.log(a, b);
      };
      __var__("foo", () => eval("foo"));
      foo(1, 2);
      const bar = (a, b) => {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        return a + b;
      };
      __var__("bar", () => eval("bar"));
      bar(3, 4);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "foo",
        "a",
        "b",
        "bar",
      ]
    `)
  })

  it('Arrow functions with no body', async () => {
    const code = `
      const foo = (a, b) => console.log(a, b);
      foo(1, 2);
      const bar = (a, b) => a + b;
      bar(3, 4);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const foo = (a, b) => {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        return console.log(a, b);
      };
      __var__("foo", () => eval("foo"));
      foo(1, 2);
      const bar = (a, b) => {
        __var__("a", () => eval("a"));
        __var__("b", () => eval("b"));
        return a + b;
      };
      __var__("bar", () => eval("bar"));
      bar(3, 4);"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "foo",
        "a",
        "b",
        "bar",
      ]
    `)
  })

  it('Top-level await', async () => {
    const code = `
      const a = await getNumber();
      console.log(a);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const a = await getNumber();
      __var__("a", () => eval("a"));
      console.log(a);"
    `)
  })

  it('Variable declarations in try/catch blocks', async () => {
    const code = `
      try {
        const a = 1;
        let b = 2;
        var c = 3;
        console.log(a, b, c);
      } catch (e) {
        console.log(e);
      }
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "try {
        const a = 1;
        __var__("a", () => eval("a"));
        let b = 2;
        __var__("b", () => eval("b"));
        var c = 3;
        __var__("c", () => eval("c"));
        console.log(a, b, c);
      } catch (e) {
        console.log(e);
      }"
    `)

    expect([...variables]).toMatchInlineSnapshot(`
      [
        "a",
        "b",
        "c",
      ]
    `)
  })
})
