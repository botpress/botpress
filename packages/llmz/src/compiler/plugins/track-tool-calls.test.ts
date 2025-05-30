import * as Babel from '@babel/standalone'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToolCallEntry, toolCallTrackingPlugin } from './track-tool-calls.js'
import { DEFAULT_TRANSFORM_OPTIONS } from '../compiler.js'
import { formatTypings } from '../../formatting.js'

const calls = new Map<number, ToolCallEntry>()
function transform(original: string) {
  const { code } = Babel.transform(original, {
    ...DEFAULT_TRANSFORM_OPTIONS,
    plugins: [toolCallTrackingPlugin(calls)],
  })

  return formatTypings(code!, {
    semi: true,
  })
}

describe('toolCallTrackingPlugin', () => {
  beforeEach(() => {
    calls.clear()
  })

  it('single assignment (sync)', async () => {
    const code = `
      var y = getNumber();
      var z = obj.getNumber();
      y = getNumber();
      let {e, w} = obj.getNumber();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "var y = (() => {
        try {
          __toolc__(0, "start");
          const __ret__ = getNumber();
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();
      var z = (() => {
        try {
          __toolc__(1, "start");
          const __ret__ = obj.getNumber();
          __toolc__(1, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(2, "end", err);
          throw new Error(err.message);
        }
      })();
      y = (() => {
        try {
          __toolc__(2, "start");
          const __ret__ = getNumber();
          __toolc__(2, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(3, "end", err);
          throw new Error(err.message);
        }
      })();
      let { e, w } = (() => {
        try {
          __toolc__(3, "start");
          const __ret__ = obj.getNumber();
          __toolc__(3, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(4, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let y = arguments[0]; return { y };",
              "left": "y",
              "type": "single",
            },
            "object": "global",
            "tool": "getNumber",
          },
        ],
        [
          2,
          {
            "assignment": {
              "evalFn": "let z = arguments[0]; return { z };",
              "left": "z",
              "type": "single",
            },
            "object": "obj",
            "tool": "getNumber",
          },
        ],
        [
          3,
          {
            "assignment": {
              "evalFn": "let y = arguments[0]; return { y };",
              "left": "y",
              "type": "single",
            },
            "object": "global",
            "tool": "getNumber",
          },
        ],
        [
          4,
          {
            "assignment": {
              "evalFn": "let {e, w} = arguments[0] ?? {}; return {e, w};",
              "left": "{e, w}",
              "type": "object",
            },
            "object": "obj",
            "tool": "getNumber",
          },
        ],
      ]
    `)
  })

  it('single assignment (async)', async () => {
    const code = `
    var y = await getNumber();
    var z = await obj.getNumber();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "var y = await(async () => {
        try {
          __toolc__(0, "start");
          const __ret__ = await getNumber();
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();
      var z = await(async () => {
        try {
          __toolc__(1, "start");
          const __ret__ = await obj.getNumber();
          __toolc__(1, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(2, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let y = arguments[0]; return { y };",
              "left": "y",
              "type": "single",
            },
            "object": "global",
            "tool": "getNumber",
          },
        ],
        [
          2,
          {
            "assignment": {
              "evalFn": "let z = arguments[0]; return { z };",
              "left": "z",
              "type": "single",
            },
            "object": "obj",
            "tool": "getNumber",
          },
        ],
      ]
    `)
  })

  it('multi-line params', async () => {
    const code = `
      var z = 
        // this is a comment
        obj // ...
        .getNumber(
          1, // this is another comment
          2,
          3
        );
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "var z =
        // this is a comment
        (() => {
          try {
            __toolc__(0, "start");
            const __ret__ = obj // ...
              .getNumber(
                1, // this is another comment
                2,
                3,
              );
            __toolc__(0, "end", __ret__);
            return __ret__;
          } catch (err) {
            __toolc__(1, "end", err);
            throw new Error(err.message);
          }
        })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let z = arguments[0]; return { z };",
              "left": "z",
              "type": "single",
            },
            "object": "obj // ",
            "tool": "",
          },
        ],
      ]
    `)
  })

  it('Object destructuring (sync)', async () => {
    const code = `
      const { a, b } = toolX([1, 2, 3]);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const { a, b } = (() => {
        try {
          __toolc__(0, "start");
          const __ret__ = toolX([1, 2, 3]);
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let { a, b } = arguments[0] ?? {}; return { a, b };",
              "left": "{ a, b }",
              "type": "object",
            },
            "object": "global",
            "tool": "toolX",
          },
        ],
      ]
    `)
  })

  it('Object destructuring (async)', async () => {
    const code = `
      const { a, b } = await toolX([1, 2, 3]);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const { a, b } = await(async () => {
        try {
          __toolc__(0, "start");
          const __ret__ = await toolX([1, 2, 3]);
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let { a, b } = arguments[0] ?? {}; return { a, b };",
              "left": "{ a, b }",
              "type": "object",
            },
            "object": "global",
            "tool": "toolX",
          },
        ],
      ]
    `)
  })

  it('Array destructuring (sync)', async () => {
    const code = `
      const [ a, b ] = toolZ();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const [a, b] = (() => {
        try {
          __toolc__(0, "start");
          const __ret__ = toolZ();
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let [a, b] = arguments[0] ?? []; return { a, b };",
              "left": "a, b",
              "type": "array",
            },
            "object": "global",
            "tool": "toolZ",
          },
        ],
      ]
    `)
  })

  it('subproperty assignment', async () => {
    const code = `
      MyObject.property = toolX();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`"MyObject.property = toolX();"`)

    expect([...calls]).toMatchInlineSnapshot(`[]`)
  })

  it('no assignment', async () => {
    const code = `
      await toolX();
      toolY();
      const s = toolZ();
    `
    const transformed = await transform(code)
    expect(transformed).toMatchInlineSnapshot(`
      "await(async () => {
        try {
          __toolc__(0, "start");
          const __ret__ = await toolX();
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(0, "end", err);
          const __newError = new Error(err.message);
          __newError.stack = err.stack + ("\\n" + __newError.stack);
          throw __newError;
        }
      })();
      (() => {
        try {
          __toolc__(1, "start");
          const __ret__ = toolY();
          __toolc__(1, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          const __newError = new Error(err.message);
          __newError.stack = err.stack + ("\\n" + __newError.stack);
          throw __newError;
        }
      })();
      const s = (() => {
        try {
          __toolc__(2, "start");
          const __ret__ = toolZ();
          __toolc__(2, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(3, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          3,
          {
            "assignment": {
              "evalFn": "let s = arguments[0]; return { s };",
              "left": "s",
              "type": "single",
            },
            "object": "global",
            "tool": "toolZ",
          },
        ],
      ]
    `)
  })

  it('yield statements are not tracked', async () => {
    const code = `
    async function* _() {
      const a = yield toolX();
      yield toolY();
  }
    `
    const transformed = await transform(code)
    expect(transformed).toMatchInlineSnapshot(`
      "async function* _() {
        const a = yield toolX();
        yield toolY();
      }"
    `)

    expect([...calls]).toMatchInlineSnapshot(`[]`)
  })

  it('built-in call expressions', async () => {
    const code = `
      const a = Number(2);
      let b = String(2);
      b = Boolean(2);
      b = new Date();
      b = String.fromCharCode(65);
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "const a = (() => {
        try {
          __toolc__(0, "start");
          const __ret__ = Number(2);
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();
      let b = (() => {
        try {
          __toolc__(1, "start");
          const __ret__ = String(2);
          __toolc__(1, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(2, "end", err);
          throw new Error(err.message);
        }
      })();
      b = (() => {
        try {
          __toolc__(2, "start");
          const __ret__ = Boolean(2);
          __toolc__(2, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(3, "end", err);
          throw new Error(err.message);
        }
      })();
      b = new Date();
      b = (() => {
        try {
          __toolc__(3, "start");
          const __ret__ = String.fromCharCode(65);
          __toolc__(3, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(4, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let a = arguments[0]; return { a };",
              "left": "a",
              "type": "single",
            },
            "object": "global",
            "tool": "Number",
          },
        ],
        [
          2,
          {
            "assignment": {
              "evalFn": "let b = arguments[0]; return { b };",
              "left": "b",
              "type": "single",
            },
            "object": "global",
            "tool": "String",
          },
        ],
        [
          3,
          {
            "assignment": {
              "evalFn": "let b = arguments[0]; return { b };",
              "left": "b",
              "type": "single",
            },
            "object": "global",
            "tool": "Boolean",
          },
        ],
        [
          4,
          {
            "assignment": {
              "evalFn": "let b = arguments[0]; return { b };",
              "left": "b",
              "type": "single",
            },
            "object": "String",
            "tool": "fromCharCode",
          },
        ],
      ]
    `)
  })

  it('re-assignment', async () => {
    const code = `
      let a = await toolX();
      a = toolY();  
      a = await toolZ();
    `
    expect(await transform(code)).toMatchInlineSnapshot(`
      "let a = await(async () => {
        try {
          __toolc__(0, "start");
          const __ret__ = await toolX();
          __toolc__(0, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(1, "end", err);
          throw new Error(err.message);
        }
      })();
      a = (() => {
        try {
          __toolc__(1, "start");
          const __ret__ = toolY();
          __toolc__(1, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(2, "end", err);
          throw new Error(err.message);
        }
      })();
      a = await(async () => {
        try {
          __toolc__(2, "start");
          const __ret__ = await toolZ();
          __toolc__(2, "end", __ret__);
          return __ret__;
        } catch (err) {
          __toolc__(3, "end", err);
          throw new Error(err.message);
        }
      })();"
    `)

    expect([...calls]).toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "assignment": {
              "evalFn": "let a = arguments[0]; return { a };",
              "left": "a",
              "type": "single",
            },
            "object": "global",
            "tool": "toolX",
          },
        ],
        [
          2,
          {
            "assignment": {
              "evalFn": "let a = arguments[0]; return { a };",
              "left": "a",
              "type": "single",
            },
            "object": "global",
            "tool": "toolY",
          },
        ],
        [
          3,
          {
            "assignment": {
              "evalFn": "let a = arguments[0]; return { a };",
              "left": "a",
              "type": "single",
            },
            "object": "global",
            "tool": "toolZ",
          },
        ],
      ]
    `)
  })
})
