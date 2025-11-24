import { describe, expect, it } from 'vitest'

import { compile } from './compiler.js'

describe('compiler', () => {
  it('should work', () => {
    const code = `
// line 1
for (let i = 0; i < 10; i++) {
  console.log(i) // line 3
// --

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
    expect(compile(code).code).toMatchInlineSnapshot(`
      "__track__(6);__comment__("line 1", 5);__comment__("__LLMZ_USER_CODE_START__", 3);



        for (let i = 0; i < 10; i++) {__track__(7);
          (() => {try {__toolc__(0, "start");const __ret__ = console.log(i);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})();__comment__("line 3", 7);__comment__("--", 8);__comment__("Comments on multiple lines\\n    Hi!", 10);__track__(14);






          if (i === 5) {__track__(16);__comment__("I will throw an error here", 15);

            throw new Error('Something went wrong');
          }
        }__comment__("__LLMZ_USER_CODE_END__", 20);


      "
    `)
  })

  it('should not replace comments inside object literals', async () => {
    const code = `
  for(let i = 0;  /* this is left as-is */ i < 10; i++) {
   // this is a comment that will be replaces
   const a = {
      b: i, // left as-is
      c: 1
      // left as-is
   }
  }
      `

    expect(compile(code).code).toMatchInlineSnapshot(`
      "__track__(5);__comment__("__LLMZ_USER_CODE_START__", 3);


        for (let i = 0; __comment__("this is left as-is", 5), i < 10; i++) {__track__(7);__comment__("this is a comment that will be replaces", 6);

          const a = {
            b: i,
            c: 1

          };__var__("a", () => eval("a"));
        }__comment__("__LLMZ_USER_CODE_END__", 14);


      "
    `)
  })

  it('transpiles typescript to javascript', async () => {
    const code = `
      async function sayHello(message: string) {
        type User = {
          name: string
        }
        const user: User = { name: 'John' }
        console.log(message, user)
        return user
      }
      await sayHello('Hello');`

    expect(compile(code).code).toMatchInlineSnapshot(`
      "__track__(5);__comment__("__LLMZ_USER_CODE_START__", 3);


        async function sayHello(message) {__var__("message", () => eval("message"));__track__(9);



          const user = { name: 'John' };__var__("user", () => eval("user"));__track__(10);
          (() => {try {__toolc__(0, "start");const __ret__ = console.log(message, user);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})();__track__(11);
          return user;
        }__track__(12);return await (
          await (async () => {try {__toolc__(1, "start");const __ret__ = await sayHello('Hello');__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})());__comment__("__LLMZ_USER_CODE_END__", 14);

      "
    `)
  })

  it('should work with async functions 3', async () => {
    const code = `
      // Adding new entries to the computed table
  const newEntries = [
    { Name: "Fleur" },
    { Name: "Pikachu" },
    { Name: "Ash" },
    { Name: "Misty" }
  ];
  
  // Function to add the new entries
  async function addNewEntries(entries) {
    for (const entry of entries) {
      await ComputedTable.createTableRow(entry);
    }
    // Send a confirmation message to the user
    chat.sendText({
      message: "I have successfully added the new persons: Fleur, Pikachu, Ash, and Misty to the computed table."
    });
  }
  
  // Execute the function to add the new entries
  await addNewEntries(newEntries);
      `
    expect(compile(code).code).toMatchInlineSnapshot(`
      "__track__(6);__comment__("Adding new entries to the computed table", 5);__comment__("__LLMZ_USER_CODE_START__", 3);



        const newEntries = [
        { Name: "Fleur" },
        { Name: "Pikachu" },
        { Name: "Ash" },
        { Name: "Misty" }];__var__("newEntries", () => eval("newEntries"));__comment__("Function to add the new entries", 13);__track__(14);



        async function addNewEntries(entries) {__var__("entries", () => eval("entries"));__track__(15);
          for (const entry of entries) {__track__(16);
            await (async () => {try {__toolc__(0, "start");const __ret__ = await ComputedTable.createTableRow(entry);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})();
          }__comment__("Send a confirmation message to the user", 18);__track__(19);

          (() => {try {__toolc__(1, "start");const __ret__ = chat.sendText({
                message: "I have successfully added the new persons: Fleur, Pikachu, Ash, and Misty to the computed table."
              });__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})();
        }__comment__("Execute the function to add the new entries", 24);__track__(25);


        return await await (async () => {try {__toolc__(2, "start");const __ret__ = await addNewEntries(newEntries);__toolc__(2, "end", __ret__);return __ret__;} catch (err) {__toolc__(2, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})();__comment__("__LLMZ_USER_CODE_END__", 27);


      "
    `)
  })

  it('valid jsx component (multiline)', async () => {
    const code = `
yield <message>
# Hello
World
</message>
`.trim()

    const result = compile(code)

    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n# Hello \\nWorld \\n"


        );__comment__("__LLMZ_USER_CODE_END__", 8);

      "
    `)
  })

  it('jsx props', async () => {
    const code = `
yield <message a={true} b={2} c d="cool">
# Hello
World
</message>
`.trim()

    const result = compile(code)

    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", { a: true, b: 2, c: true, d: "cool" }, "\\n# Hello \\nWorld \\n"


        );__comment__("__LLMZ_USER_CODE_END__", 8);

      "
    `)
  })

  it('nested jsx components', async () => {
    const code = `
yield <message a={true} b={2} c d="cool">
# Hello {user.name}
<button url="https://botpress.com">Home Page</button>
<button url="https://botpress.com/pricing">Pricing</button>
</message>
`.trim()

    const result = compile(code)

    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", { a: true, b: 2, c: true, d: "cool" }, "\\n# Hello ",
        user.name, "\\n", (__track__(6), (() => {try {__toolc__(0, "start");const __ret__ =
            __jsx__("button", { url: "https://botpress.com" }, "Home Page");__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n", (__track__(7), (() => {try {__toolc__(1, "start");const __ret__ =
            __jsx__("button", { url: "https://botpress.com/pricing" }, "Pricing");__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n"
        );__comment__("__LLMZ_USER_CODE_END__", 9);

      "
    `)
  })

  it('multiple yields', async () => {
    const code = `
yield <message>
<message:button text="hello" />
<message:button>World</message:button>
</message>
yield <message>Hello</message>
yield <message>How are you?</message>
`.trim()

    const result = compile(code)

    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n", (__track__(5), (() => {try {__toolc__(0, "start");const __ret__ =
            __jsx__("message:button", { text: "hello" });__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n", (__track__(6), (() => {try {__toolc__(1, "start");const __ret__ =
            __jsx__("message:button", null, "World");__toolc__(1, "end", __ret__);return __ret__;} catch (err) {__toolc__(1, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n"
        );__track__(8);
        yield __jsx__("message", null, "Hello");__track__(9);
        yield __jsx__("message", null, "How are you?");__comment__("__LLMZ_USER_CODE_END__", 10);

      "
    `)
  })

  it('nested jsx components', async () => {
    const code = `
yield <message>
<message:button />
</message>
`.trim()

    const result = compile(code)

    expect(result.code).toMatchInlineSnapshot(`
      "__track__(4);__comment__("__LLMZ_USER_CODE_START__", 3);

        yield __jsx__("message", null, "\\n", (__track__(5), (() => {try {__toolc__(0, "start");const __ret__ =
            __jsx__("message:button", null);__toolc__(0, "end", __ret__);return __ret__;} catch (err) {__toolc__(0, "end", err);const __newError = new Error(err.message);__newError.stack = err.stack + ("\\n" + __newError.stack);throw __newError;}})()), "\\n"
        );__comment__("__LLMZ_USER_CODE_END__", 7);

      "
    `)
  })
})
