import * as Babel from '@babel/standalone'
import { describe, expect, it } from 'vitest'

import { lineTrackingBabelPlugin } from './line-tracking.js'
import { DEFAULT_TRANSFORM_OPTIONS } from '../compiler.js'

function lineTrackingTransform(code: string) {
  return Babel.transform(code, {
    ...DEFAULT_TRANSFORM_OPTIONS,
    plugins: [lineTrackingBabelPlugin],
  })
}

describe('lineTrackingBabelPlugin', () => {
  it('should transform constant and variable declarations', async () => {
    const code = `
      const a = 10;
      let x = 5;
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const a = 10;__track__(3);
      let x = 5;"
    `)
  })

  it('should transform function declarations', async () => {
    const code = `
      function test() {
        const b = 20;
        console.log(a + b);
      }
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      function test() {__track__(3);
        const b = 20;__track__(4);
        console.log(a + b);
      }"
    `)
  })

  it('should transform arrow functions', async () => {
    const code = `
      const foo = () => {
        console.log('foo');
      }
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const foo = () => {__track__(3);
        console.log('foo');
      };"
    `)
  })

  it('should transform arrow functions with implicit return', async () => {
    const code = `
      const boo = () => 1 + 1;
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const boo = () => 1 + 1;"
    `)
  })

  it('should transform class declarations', async () => {
    const code = `
      class Foo {
        constructor() {
          const b = 20;
          console.log('Foo');
        }
      }
      const fooInstance = new Foo();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "
      class Foo {__track__(3);
        constructor() {__track__(4);
          const b = 20;__track__(5);
          console.log('Foo');
        }
      }__track__(8);
      const fooInstance = new Foo();"
    `)
  })

  it('should track for loop iteration count', async () => {
    const code = `
      for (let i = 0; i < 3; i++) {
        console.log(i);
      }
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "
      for (let i = 0; i < 3; i++) {__track__(3);
        console.log(i);
      }"
    `)
  })

  it('should transform function calls', async () => {
    const code = `
      function test() {
        const b = 20;
        console.log(a + b);
        return a + b;
      }
      test();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      function test() {__track__(3);
        const b = 20;__track__(4);
        console.log(a + b);__track__(5);
        return a + b;
      }__track__(7);
      test();"
    `)
  })

  it('should transform object creation and manipulation', async () => {
    const code = `
      const obj = {
        name: 'Test',
        greet() {
          console.log('Hello ' + this.name);
        }
      };
      obj.greet();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const obj = {
        name: 'Test',
        greet() {__track__(5);
          console.log('Hello ' + this.name);
        }
      };__track__(8);
      obj.greet();"
    `)
  })

  it('should transform array declarations', async () => {
    const code = `
    const arr = [1, 2, 3, 4, 5];
      const doubled = arr.map(num => num * 2);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const arr = [1, 2, 3, 4, 5];__track__(3);
      const doubled = arr.map((num) => num * 2);"
    `)
  })
  it('should transform array operations', async () => {
    const code = `
    const arr = [1, 2, 3, 4, 5];
      const doubled = arr.map(num => num * 2);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const arr = [1, 2, 3, 4, 5];__track__(3);
      const doubled = arr.map((num) => num * 2);"
    `)
  })
  it('should transform array operations with return statement', async () => {
    const code = `
    const arr = [1, 2, 3, 4, 5];
      const doubled = arr.map(num => {
        return num + 2;
      });
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const arr = [1, 2, 3, 4, 5];__track__(3);
      const doubled = arr.map((num) => {__track__(4);
        return num + 2;
      });"
    `)
  })

  it('should transform curry functions - arrow notation', async () => {
    const code = `
      const add = a => b => a + b;
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const add = (a) => (b) => a + b;"
    `)
  })
  it('should transform curry functions - function notation', async () => {
    const code = `
    function add(a) {
      return function(b) {
        return a + b;
      }
    }
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      function add(a) {__track__(3);
        return function (b) {__track__(4);
          return a + b;
        };
      }"
    `)
  })

  it('should transform async functions', async () => {
    const code = `
      const asyncFunction = async () => {
        console.log('Done!');
      };
      asyncFunction();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const asyncFunction = async () => {__track__(3);
        console.log('Done!');
      };__track__(5);
      asyncFunction();"
    `)
  })

  it('should transform awaited call expressions', async () => {
    const code = `
      const asyncFunction = async () => {
          await something(200)        
      };
      asyncFunction();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const asyncFunction = async () => {__track__(3);
        await something(200);
      };__track__(5);
      asyncFunction();"
    `)
  })

  it('should transform awaited return', async () => {
    const code = `
      const asyncFunction = async () => {
         return await something(200)        
      };
      asyncFunction();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const asyncFunction = async () => {__track__(3);
        return await something(200);
      };__track__(5);
      asyncFunction();"
    `)
  })

  it('should transform arrow functions that return call expressions', async () => {
    const code = `
      setTimeout(() => resolve('Done!'), 1000);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      setTimeout(() => resolve('Done!'), 1000);"
    `)
  })
  it('should transform promises and async/await', async () => {
    const code = `
      setTimeout(() => {
        return resolve('Done!')
     });
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      setTimeout(() => {__track__(3);
        return resolve('Done!');
      });"
    `)
  })

  it('should transform destructuring assignment', async () => {
    const code = `
      const arr = [1, 2, 3, 4, 5];
      const [first, second] = arr;
      console.log(first, second);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const arr = [1, 2, 3, 4, 5];__track__(3);
      const [first, second] = arr;__track__(4);
      console.log(first, second);"
    `)
  })

  it('should transform template literals', async () => {
    const code = `
      const name = 'World';
      console.log(\`Hello, \${name}!\`);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const name = 'World';__track__(3);
      console.log(\`Hello, \${name}!\`);"
    `)
  })

  it('should transform spread operator', async () => {
    const code = `
      const arr = [1, 2, 3, 4, 5];
      const newArr = [...arr, 6, 7, 8];
      console.log(newArr);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const arr = [1, 2, 3, 4, 5];__track__(3);
      const newArr = [...arr, 6, 7, 8];__track__(4);
      console.log(newArr);"
    `)
  })

  it('should transform rest parameters', async () => {
    const code = `
      const sum = (...numbers) => {
        return numbers.reduce((total, num) => total + num, 0);
      };
      console.log(sum(1, 2, 3, 4));
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const sum = (...numbers) => {__track__(3);
        return numbers.reduce((total, num) => total + num, 0);
      };__track__(5);
      console.log(sum(1, 2, 3, 4));"
    `)
  })

  it('should transform default parameters', async () => {
    const code = `
      function greet(name = 'stranger') {
        console.log(\`Hello, \${name}!\`);
      }
      greet();
      greet('John');
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      function greet(name = 'stranger') {__track__(3);
        console.log(\`Hello, \${name}!\`);
      }__track__(5);
      greet();__track__(6);
      greet('John');"
    `)
  })

  it('should transform ternary operator', async () => {
    const code = `
      const age = 18;
      const canVote = age >= 18 ? 'Yes' : 'No';
      console.log(canVote);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const age = 18;__track__(3);
      const canVote = age >= 18 ? 'Yes' : 'No';__track__(4);
      console.log(canVote);"
    `)
  })

  it('should transform nullish coalescing operator', async () => {
    const code = `
      const nullValue = null;
      const value = nullValue ?? 'Default value';
      console.log(value);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const nullValue = null;__track__(3);
      const value = nullValue ?? 'Default value';__track__(4);
      console.log(value);"
    `)
  })

  it('should transform optional chaining', async () => {
    const code = `
      const user = {
        address: {
          street: 'Main St',
        },
      };
      console.log(user?.address?.street);
      console.log(user?.contact?.phone);
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const user = {
        address: {
          street: 'Main St'
        }
      };__track__(7);
      console.log(user?.address?.street);__track__(8);
      console.log(user?.contact?.phone);"
    `)
  })

  it('should transform IIFE (Immediately Invoked Function Expression)', async () => {
    const code = `
      (function() {
        console.log('IIFE executed');
      })();
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      (function () {__track__(3);
        console.log('IIFE executed');
      })();"
    `)
  })

  it('should not instrument in between await<->statement', async () => {
    const code = `
      const a = await myFunction();
      return await fetch('https://api.example.com');
    `
    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const a = await myFunction();__track__(3);
      return await fetch('https://api.example.com');"
    `)
  })

  it('tracks inside block statements', async () => {
    const code = `
  // Function to add the new entries
  async function addNewEntries(entries) {
    for (const entry of entries) {
      await ComputedTable.createTableRow(entry)
    }
    // Send a confirmation message to the user
    chat.sendText({
      message: 'I have successfully added the new persons: Fleur, Pikachu, Ash, and Misty to the computed table.'
    })
  }`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(3);
      // Function to add the new entries
      async function addNewEntries(entries) {__track__(4);
        for (const entry of entries) {__track__(5);
          await ComputedTable.createTableRow(entry);
        }
        // Send a confirmation message to the user
        __track__(8);chat.sendText({
          message: 'I have successfully added the new persons: Fleur, Pikachu, Ash, and Misty to the computed table.'
        });
      }"
    `)
  })

  it('tracks all tool usage', async () => {
    const code = `
const value = await chat.sendText({
  message: \`
  Hello, world!
  \`
});

// A comment here
await chat.sendText({
  message: generateText()
});

void chat.sendText({
  message: generateText()
});
`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      const value = await chat.sendText({
        message: \`
        Hello, world!
        \`
      });

      // A comment here
      __track__(9);await chat.sendText({
        message: generateText()
      });__track__(13);

      void chat.sendText({
        message: generateText()
      });"
    `)
  })

  it('should not track statements inside variable declarations', async () => {
    const code = `
myTool({
  message: generateText()
});

myTool({
  message: (() => generateText())()
});

myTool({
  message: await generateData()
});

myTool({
  message: function(){ return generateText() }()
});
`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      myTool({
        message: generateText()
      });__track__(6);

      myTool({
        message: (() => generateText())()
      });__track__(10);

      myTool({
        message: await generateData()
      });__track__(14);

      myTool({
        message: function () {__track__(15);return generateText();}()
      });"
    `)
  })

  it('should not track statements inside variable declarations', async () => {
    const code = `
return await myTool({
  message: generateText(),
  [ getKey() ]: {
    value: await getValue()
  },
  [ (() => getKey())() ]: true
})
`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      return await myTool({
        message: generateText(),
        [getKey()]: {
          value: await getValue()
        },
        [(() => getKey())()]: true
      });"
    `)
  })

  it('should skip indexers', async () => {
    const code = `

    const text = void getText();
    const index = text[getIndex()];
    const value = index.indexOf(getValue());

`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(3);

      const text = void getText();__track__(4);
      const index = text[getIndex()];__track__(5);
      const value = index.indexOf(getValue());"
    `)
  })

  it('should skip indexers', async () => {
    const code = `

    let a = (1 + getNumber());
    a += (2 + getNumber());
    const b = (await getNumber());
    if (--d && e()) {
      f();
    }

`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(3);

      let a = 1 + getNumber();__track__(4);
      a += 2 + getNumber();__track__(5);
      const b = await getNumber();
      if (--d && e()) {__track__(7);
        f();
      }"
    `)
  })
  it('should add track object property assignments', async () => {
    const code = `
      workflow.variable_values['name'] = 'John';
      workflow.name = 'John';
      workflow.address = {
        street: 'Main St',
        city: 'New York'}
`

    expect(lineTrackingTransform(code).code).toMatchInlineSnapshot(`
      "__track__(2);
      workflow.variable_values['name'] = 'John';__track__(3);
      workflow.name = 'John';__track__(4);
      workflow.address = {
        street: 'Main St',
        city: 'New York' };"
    `)
  })
})
