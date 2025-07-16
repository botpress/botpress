import { assert, describe, expect, it, vi } from 'vitest'

import { CodeExecutionError, InvalidCodeError, VMSignal } from './errors.js'
import { runAsyncFunction, USE_ISOLATED_VM } from './vm.js'
import { Trace, Traces } from './types.js'

describe('llmz/vm', () => {
  it('stack traces points to original source map code', async () => {
    const code = `
// line 1
for (let i = 0; i < 10; i++) {
  console.log(i) // line 3
/*
Comments on multiple lines
Hi!
*/
 if (i === 5) {
    // I will throw an error here
    throw new Error('Something went wrong')
  }
}
`
    let traces = []
    const result = await runAsyncFunction({}, code, traces)

    assert(result.success === false)
    expect(result.error.message).toMatchInlineSnapshot(`"Something went wrong"`)
    expect(traces).toHaveLength(21)
    assert(result.error instanceof CodeExecutionError)
    expect(result.error.stacktrace).toMatchInlineSnapshot(`
      "001 | 
        002 | // line 1
        003 | for (let i = 0; i < 10; i++) {
        004 |   console.log(i) // line 3
        005 | /*
        006 | Comments on multiple lines
        007 | Hi!
        008 | */
        009 |  if (i === 5) {
        010 |     // I will throw an error here
      > 011 |     throw new Error('Something went wrong')
      ...^^^^^^^^^^
        012 |   }
        013 | }
        014 |"
    `)
    expect(
      result.traces
        .map((x) => `${x.type}: ${x.type === 'comment' ? x.comment : x.type === 'log' ? x.message : ''}`)
        .join('\n')
    ).toMatchInlineSnapshot(`
      "comment: line 1
      log: 0
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      log: 1
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      log: 2
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      log: 3
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      log: 4
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      log: 5
      comment: line 3
      comment: Comments on multiple lines
          Hi!
      comment: I will throw an error here
      code_execution_exception: "
    `)
  })

  it('should throw on errors inside functions', async () => {
    const code = `
    async function test() { 
      throw new Error('Something went wrong')
    }
    await test()

`
    const result = await runAsyncFunction({}, code)

    assert(result.success === false)
    expect(result.error.message).toMatchInlineSnapshot(`"Something went wrong"`)
  })

  it('should work with async functions', async () => {
    const code = `
// -----------
// this is a comment
// -----------
function test(a,b) {
  // another comment
  const c = a + b
  if (c > 10) {
    myTool();
  }
  return c + 10
}
// -----------
console.log(test(2, 6));
// -----------
console.log( /* this is a comment */ test(5, 6));
    `.trim()

    const myTool = () => {
      throw new Error('My Tool')
    }

    const result = await runAsyncFunction({ myTool }, code)

    assert(result.success === false)
    expect(result.error.message).toMatchInlineSnapshot(`"My Tool"`)
    assert(result.error instanceof CodeExecutionError)

    expect(result.error.stacktrace).toMatchInlineSnapshot(`
      "001 | // -----------
        002 | // this is a comment
        003 | // -----------
        004 | function test(a,b) {
        005 |   // another comment
        006 |   const c = a + b
        007 |   if (c > 10) {
      > 008 |     myTool();
      ...^^^^^^^^^^
        009 |   }
        010 |   return c + 10
        011 | }
        012 | // -----------
        013 | console.log(test(2, 6));
        014 | // -----------
      > 015 | console.log( /* this is a comment */ test(5, 6));
      ...^^^^^^^^^^"
    `)
    expect(result.lines_executed.join(' ')).toMatchInlineSnapshot(`"2,1 11,1 4,2 5,2 8,1 13,1 6,1"`)
  })

  it('should throw `InvalidCodeError` if code is not valid', async () => {
    const code = `

    const a = 'hello'
    const a = 'world'
   `

    await expect(() => runAsyncFunction({}, code)).rejects.toThrowError(InvalidCodeError)
  })

  describe('signal handling', () => {
    const debugContext = {
      THROW_SIGNAL: () => {
        throw new VMSignal('This is a signal')
      },
    }

    it.skipIf(process.env.CI)('signals throw with truncated code attached and variable values', async () => {
      const code = `
      // Comment here
      const a = 10;
      const b = 20;
      const c = a + b;
      
      const doThrow = () => {
          // Comment here
          THROW_SIGNAL();
      }

      if (c > 10) {
        doThrow()
      }
        
      // This will be truncated from the stack trace
    `.trim()

      const result = await runAsyncFunction(debugContext, code)

      expect(result.success).toBe(true)
      expect(result.signal).toBeDefined()
      expect(result.signal).toBeInstanceOf(VMSignal)

      expect(result.signal?.stack).toMatchInlineSnapshot(`
        "001 | // Comment here
          002 |       const a = 10;
          003 |       const b = 20;
          004 |       const c = a + b;
          005 |       
          006 |       const doThrow = () => {
          007 |           // Comment here
        > 008 |           THROW_SIGNAL();
        ...^^^^^^^^^^
          009 |       }
          010 | 
          011 |       if (c > 10) {
        > 012 |         doThrow()
        ...^^^^^^^^^^
          013 |       }
          014 |         
          015 |       // This will be truncated from the stack trace"
      `)

      expect(result.signal?.truncatedCode).toMatchInlineSnapshot(`
        "001 | // Comment here
          002 |       const a = 10;
          003 |       const b = 20;
          004 |       const c = a + b;
          005 |       
          006 |       const doThrow = () => {
          007 |           // Comment here
        > 008 |           THROW_SIGNAL();
        ...^^^^^^^^^^
          009 |       }
          010 | 
          011 |       if (c > 10) {
        > 012 |         doThrow()
        ...^^^^^^^^^^"
      `)

      expect(result.signal?.variables).toMatchInlineSnapshot(`
        {
          "a": 10,
          "b": 20,
          "c": 30,
          "doThrow": "[[non-primitive]]",
        }
      `)
    })
  })

  describe('yield statements', () => {
    it('nested yield components', async () => {
      const message = vi.fn()
      const code = `
yield <message prop1={{ hey: 'there' }}>
<message:button my-bool />
Hey!
</message>  
`.trim()

      const result = await runAsyncFunction({ message }, code)
      expect(result.success).toBe(true)
      expect(message.mock.calls.length).toBe(1)
      expect(message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "
        ",
            {
              "__jsx": true,
              "children": [],
              "props": {
                "my-bool": true,
              },
              "type": "MESSAGE:BUTTON",
            },
            "
        Hey! 
        ",
          ],
          "props": {
            "prop1": {
              "hey": "there",
            },
          },
          "type": "MESSAGE",
        }
      `)
    })

    it('multiple yields', async () => {
      const message = vi.fn()
      const button = vi.fn()
      const code = `
  yield <message id={1} />;
  yield <message id={2} />;
  yield <message id={3} />;
  yield <button id={4} />;
  `.trim()

      const result = await runAsyncFunction({ message, button }, code)
      expect(result.success).toBe(true)
      expect(message.mock.calls.length).toBe(3)
      expect(button.mock.calls.length).toBe(1)
    })

    it('multi-line yield', async () => {
      const mEssAge = vi.fn()
      const code = `
yield <Message id={1}>
# Hello world!
This is a multi-line message
  - List item 1
  - List item 2
\`\`\`
console.log('Hello')
\`\`\`

End.
</Message>
`.trim()

      const result = await runAsyncFunction({ mEssAge }, code)
      expect(result.success).toBe(true)
      expect(mEssAge.mock.calls.length).toBe(1)
      expect(mEssAge.mock.calls[0]![0].props.id).toBe(1)
      expect(mEssAge.mock.calls[0]![0].children[0]).toMatchInlineSnapshot(`
        "
        # Hello world! 
        This is a multi-line message 
          - List item 1 
          - List item 2 
        \`\`\` 
        console.log('Hello') 
        \`\`\` 
         
        End. 
        "
      `)
    })

    it('yield throwing fails the execution', async () => {
      const message = vi.fn()
      const err = () => {
        throw new Error('Oops')
      }
      const code = `
yield <message id={1} />;
yield err();
`.trim()

      const result = await runAsyncFunction({ message, err }, code)
      expect(result.success).toBe(false)
      expect(message.mock.calls.length).toBe(1)
      expect(result.success === false && result.error.message).toBe('Oops')
    })
  })

  describe('return statements', () => {
    it('no return', async () => {
      const code = `
const a = 10
const b = 20
const c = a + b
`.trim()

      const result = await runAsyncFunction({}, code)
      assert(result.success)
      expect(result.return_value).toBeUndefined()
    })

    it('return think with variables', async () => {
      const code = `
const a = 10
const b = 20
const c = a + b
return { action: 'think', a,b,c,d: 'hello' }
`.trim()

      const result = await runAsyncFunction({}, code)
      assert(result.success)
      expect(result.return_value).not.toBeUndefined()
      expect(result.return_value).toMatchInlineSnapshot(`
        {
          "a": 10,
          "action": "think",
          "b": 20,
          "c": 30,
          "d": "hello",
        }
      `)
    })

    it('return promise is awaited', async () => {
      const code = `
const value = async () => {
  await wait(100);
  return 'hello'
}
return value()
`.trim()

      const result = await runAsyncFunction(
        { wait: async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)) },
        code
      )

      assert(result.success)
      expect(result.return_value).not.toBeUndefined()
      expect(result.return_value).toMatchInlineSnapshot(`"hello"`)
    })
  })

  describe('Node/JS primitives', () => {
    it('can use and return primitives', async () => {
      const code = `
return {
  date: new Date('2021-01-01').toISOString()
}
`.trim()

      const result = await runAsyncFunction({}, code)

      assert(result.success)
      expect(result.return_value).not.toBeUndefined()
      expect(result.return_value).toMatchInlineSnapshot(`
        {
          "date": "2021-01-01T00:00:00.000Z",
        }
      `)
    })
  })

  describe('get/set variables inside VM', () => {
    it('can read & print variables of various types', async () => {
      const code = `
        const stringified = JSON.stringify(myVars)
        console.log(stringified)
        return stringified
      `

      const context = {
        myVars: {
          a: 10,
          b: 'hello',
          c: true,
          d: {
            e: 'world',
          },
          f: [1, 2, 3],
        },
      }

      let traces: Trace[] = []
      const result = await runAsyncFunction(context, code, traces)

      assert(result.success)
      expect(result.return_value).toMatchInlineSnapshot(`"{"a":10,"b":"hello","c":true,"d":{"e":"world"},"f":[1,2,3]}"`)
      expect(traces.find((x): x is Traces.Log => x.type === 'log')?.message).toMatchInlineSnapshot(
        `"{"a":10,"b":"hello","c":true,"d":{"e":"world"},"f":[1,2,3]}"`
      )
    })

    it('variable mutations are returned', async () => {
      const code = `
        myVars.a += 10
        myVars.b += ' world'
        myVars.c = false
        myVars.d.e += '!'
        myVars.f.push(4)

        const stringified = JSON.stringify(myVars)
        console.log(stringified)

        return myVars
      `

      const context = {
        myVars: {
          a: 10,
          b: 'hello',
          c: true,
          d: {
            e: 'world',
          },
          f: [1, 2, 3],
          g: null,
          h: undefined,
        },
      }

      let traces: Trace[] = []
      const result = await runAsyncFunction(context, code, traces)

      assert(result.success)
      expect(result.return_value).toMatchInlineSnapshot(`
        {
          "a": 20,
          "b": "hello world",
          "c": false,
          "d": {
            "e": "world!",
          },
          "f": [
            1,
            2,
            3,
            4,
          ],
          "g": null,
          "h": undefined,
        }
      `)

      expect(traces.find((x): x is Traces.Log => x.type === 'log')?.message).toMatchInlineSnapshot(
        `"{"a":20,"b":"hello world","c":false,"d":{"e":"world!"},"f":[1,2,3,4],"g":null}"`
      )

      expect(context.myVars).toEqual(result.return_value)
    })

    it('mutates variable references', async () => {
      const code = `
        myObj.name = 'John'
        myArr.push(4)
        aNumber = 102
      `

      const context = { myObj: {}, myArr: [1, 2, 3], aNumber: 99 }
      const result = await runAsyncFunction(context, code)

      assert(result.success)
      expect(result.variables).toMatchInlineSnapshot(`{}`)

      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "name": "John",
        }
      `)

      expect(context.myArr).toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
          4,
        ]
      `)

      expect(context.aNumber).toBe(102)
    })

    it('mutates even when it throws later', async () => {
      const code = `
        myObj.name = 'John'
        throw new Error('Something went wrong')
      `

      const context = { myObj: {} }
      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)

      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "name": "John",
        }
      `)
    })

    it('mutates even when called inside of functions', async () => {
      const code = `
        function test() {
          myObj.name = 'John'
        }
        test()
      `

      const context = { myObj: {} }
      const result = await runAsyncFunction(context, code)

      assert(result.success)

      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "name": "John",
        }
      `)
    })

    it('sealed variables remained sealed inside VM (1)', async () => {
      const code = `
        myObj.age = 33;
      `

      const context = {
        myObj: Object.seal({ name: 'Jane' }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)
      expect(result.error).toMatchInlineSnapshot(
        `[CodeExecutionError: Cannot add property age, object is not extensible]`
      )
    })

    it('sealed variables remained sealed inside VM (2)', async () => {
      const code = `
        delete myObj.name
      `

      const context = {
        myObj: Object.seal({ name: 'Jane' }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)
    })

    it('non-extensible variables remain inside VM (1)', async () => {
      const code = `
        myObj.name = 'John'
      `

      const context = {
        myObj: Object.preventExtensions({ name: 'Jane' }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(true)
      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "name": "John",
        }
      `)
    })

    it('non-extensible variables remain inside VM (2)', async () => {
      const code = `
        myObj.age = 33
      `

      const context = {
        myObj: Object.preventExtensions({ name: 'Jane' }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)
      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "name": "Jane",
        }
      `)
    })

    it('non-extensible variables remain inside VM (3)', async () => {
      const code = `
        delete myObj.name
      `

      const context = {
        myObj: Object.preventExtensions({ name: 'Jane' }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(true)
      expect(context.myObj).toMatchInlineSnapshot(`{}`)
    })

    it('sealed with undefined & null props are still valid properties', async () => {
      const code = `
        myObj.age = 33
        myObj.city = 'Quebec'
      `

      const context = {
        myObj: Object.preventExtensions({ name: 'Jane', age: undefined, city: null }),
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(true)
      expect(context.myObj).toMatchInlineSnapshot(`
        {
          "age": 33,
          "city": "Quebec",
          "name": "Jane",
        }
      `)
    })

    it('defined properties with getter/setters and sealed is copied over correctly', async () => {
      const code = `
        myObj.age = 33
        myObj.city = 'Quebec'
      `

      const innerValues = {
        __origin: 'test',
        name: 'Jane',
        age: undefined,
        city: null,
      }

      const myObj = {
        __origin: 'test',
      }

      Object.defineProperty(myObj, 'name', {
        enumerable: true,
        get() {
          return innerValues.name
        },
        set(value) {
          innerValues.name = value
        },
      })

      Object.defineProperty(myObj, 'age', {
        enumerable: true,
        get() {
          return innerValues.age
        },
        set(value) {
          innerValues.age = value
        },
      })

      Object.defineProperty(myObj, 'city', {
        enumerable: true,
        get() {
          return innerValues.city
        },
        set(value) {
          innerValues.city = value
        },
      })

      Object.preventExtensions(myObj)
      Object.seal(myObj)

      const context = {
        myObj,
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(true)
      expect(process.env.VM_DRIVER === 'isolated-vm' ? context.myObj : innerValues).toMatchInlineSnapshot(`
        {
          "__origin": "test",
          "age": 33,
          "city": "Quebec",
          "name": "Jane",
        }
      `)
    })

    it('setters are executed before next statement (obj)', async () => {
      const code = `
        log('1')
        myObj.age = 33
        log('2')
        myObj.address = { street: '666' }
        log('3')
        myObj.city = 'Quebec'
        log('4')
      `

      const innerValues = {
        __origin: 'test',
        name: 'Jane',
        age: undefined,
        address: { street: '123 Main St' },
        city: null,
      }

      const myObj = {
        __origin: 'test',
      }

      Object.defineProperty(myObj, 'age', {
        enumerable: true,
        get() {
          return innerValues.age
        },
        set(value) {
          innerValues.age = value
        },
      })

      Object.defineProperty(myObj, 'city', {
        enumerable: true,
        get() {
          return innerValues.city
        },
        set(value) {
          throw new Error('Invalid city ' + value)
        },
      })

      Object.defineProperty(myObj, 'address', {
        enumerable: true,
        get() {
          return innerValues.address
        },
        set(value) {
          innerValues.address = value
        },
      })

      Object.preventExtensions(myObj)
      Object.seal(myObj)

      const calls: string[] = []
      const context = {
        myObj,
        log: (message: string) => {
          calls.push(message)
        },
      }

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)
      expect(calls).toMatchInlineSnapshot(`
        [
          "1",
          "2",
          "3",
        ]
      `)
      expect(innerValues).toMatchInlineSnapshot(`
        {
          "__origin": "test",
          "address": {
            "street": "666",
          },
          "age": 33,
          "city": null,
          "name": "Jane",
        }
      `)
      expect(result.error?.message).toMatchInlineSnapshot(`"Invalid city Quebec"`)
    })

    it.skipIf(process.env.CI)('setters are executed before next statement (top-level)', async () => {
      const code = `
        log('1')
        age = 33
        log('2')
        address = { street: '666' }
        log('3')
        city = 'Quebec'
        log('4')
      `

      const innerValues = {
        __origin: 'test',
        name: 'Jane',
        age: undefined,
        city: null,
        address: { street: '123 Main St' },
      }

      const calls: string[] = []
      const context = {
        log: (message: string) => {
          calls.push(message)
        },
      }

      Object.defineProperty(context, 'age', {
        enumerable: true,
        get() {
          return innerValues.age
        },
        set(value) {
          innerValues.age = value
        },
      })

      Object.defineProperty(context, 'city', {
        enumerable: true,
        get() {
          return innerValues.city
        },
        set(value) {
          throw new Error('Invalid city ' + value)
        },
      })

      Object.defineProperty(context, 'address', {
        enumerable: true,
        get() {
          return innerValues.address
        },
        set(value) {
          innerValues.address = value
        },
      })

      const result = await runAsyncFunction(context, code)

      expect(result.success).toBe(false)
      expect(calls).toMatchInlineSnapshot(`
        [
          "1",
          "2",
          "3",
        ]
      `)
      expect(innerValues).toMatchInlineSnapshot(`
        {
          "__origin": "test",
          "address": {
            "street": "666",
          },
          "age": 33,
          "city": null,
          "name": "Jane",
        }
      `)
      expect(result.error?.message).toMatchInlineSnapshot(`"Invalid city Quebec"`)
    })

    it('defined function works inside object', async () => {
      const code = `
        const result = await myObject.myFn()
        return myObject.myProperty + result;
      `

      const context = {
        myObject: {
          myProperty: 'property:',
          myFn: async () => {
            return 'Hello World'
          },
        },
      }

      const result = await runAsyncFunction(context, code)
      assert(result.success)

      expect(result.return_value).toMatchInlineSnapshot(`"property:Hello World"`)
    })

    it('defined function works inside object', async () => {
      const code = `
        const result = await workflow.myFn()
        workflow.myObject = { message: result, name: workflow.userName };
        return 'property:' + workflow.myObject.message;
      `

      const context = {
        workflow: {
          userName: 'unset',
          myObject: undefined,
          myFn: async () => {
            return 'Hello World'
          },
        },
      }

      const result = await runAsyncFunction(context, code)

      assert(result.success)
      expect(result.return_value).toMatchInlineSnapshot(`"property:Hello World"`)
      expect(context.workflow).toMatchInlineSnapshot(`
        {
          "myFn": [Function],
          "myObject": {
            "message": "Hello World",
            "name": "unset",
          },
          "userName": "unset",
        }
      `)
    })
  })

  describe('global variables', () => {
    it('can re-declare variables part of the context (var, const, let)', async () => {
      const code = `
        const a = 10
        let b = 20
        var c = 30
        d = 40
        // e is not touched
        return a + b + c + d + e
      `

      const context = { a: 1, b: 2, c: 3, d: 4, e: 5 }
      const result = await runAsyncFunction(context, code)

      assert(result.success)
      expect(result.return_value).toBe(105)
    })

    it.skipIf(!USE_ISOLATED_VM)('aborting execution', async () => {
      const code = `
      await longFn()
      notCalled()
      `

      const controller = new AbortController()

      let called = false

      const exec = runAsyncFunction(
        {
          count: 0,
          longFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5_000))
          },
          notCalled: () => {
            called = true
          },
        },
        code,
        [],
        controller.signal
      )

      await new Promise((resolve) =>
        setTimeout(() => {
          controller.abort()
          resolve(void 0)
        }, 100)
      )

      controller.abort()

      const result = await exec

      expect(result.success).toBe(false)
      expect(result.error).toMatchInlineSnapshot(`[Error: Execution was aborted]`)
      expect(called).toBe(false)
    })
  })
})
