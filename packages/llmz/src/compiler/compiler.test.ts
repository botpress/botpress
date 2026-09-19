import { describe, expect, it } from 'vitest'

import { compile, hasTopLevelReturn } from './compiler.js'

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
      "
                                    

      ;__comment__("line 1", 5);
      __track__(6);for (let i = 0; i < 10; (__llmz_guard(), i++)) {
        __track__(7);(__llmz_guard(), __llmz_checkpoint((() => {__llmz_guard();try {__toolc__(0, "start");const __ret__ = (__llmz_guard(), __llmz_checkpoint(console.log(i)));__toolc__(0, "end", __ret__, false);return __ret__;} catch (err) {__toolc__(0, "end", err, false);__llmz_guard();const __newError = (__llmz_guard(), __llmz_checkpoint(new Error(err.message)));(__llmz_guard(), __newError.name = err.name || "Error");(__llmz_guard(), __newError.stack = err.stack + ("\\n" + __newError.stack));throw __newError;}})())) ;__comment__("line 3", 7);
      ;__comment__("--", 8);

      ;__comment__("Comments on multiple lines\\nHi!", 10);



        __track__(14);if (i === 5) {
          ;__comment__("I will throw an error here", 15);
          __track__(16);throw (__llmz_guard(), __llmz_checkpoint(new Error('Something went wrong')))
        }
      }"
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
      "
                                    

        __track__(5);for(let i = 0;                           i < 10; (__llmz_guard(), i++)) {
         ;__comment__("this is a comment that will be replaces", 6);
         __track__(7);const a = {
            b: i,              
            c: 1
                         
         }
        }"
    `)
  })

  it('rejects typescript with a helpful error', async () => {
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

    expect(() => compile(code)).toThrowErrorMatchingInlineSnapshot(
      `[SyntaxError: Unexpected token (5:37). The code must be plain JavaScript: do not use TypeScript syntax (type annotations, "as" casts, generics, interfaces or type aliases).]`
    )
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
      "
                                    

            ;__comment__("Adding new entries to the computed table", 5);
        __track__(6);__var__("newEntries", () => eval("newEntries"), undefined, "initialize");const newEntries = __var__("newEntries", () => eval("newEntries"), ([
          { Name: "Fleur" },
          { Name: "Pikachu" },
          { Name: "Ash" },
          { Name: "Misty" }
        ]), "assignment");
        
        ;__comment__("Function to add the new entries", 13);
        __track__(14);async function addNewEntries(entries) {__llmz_guard();
          __track__(15);for (const entry of entries) {
            __track__(16);(__llmz_guard(), __llmz_checkpoint(await (__llmz_guard(), __llmz_checkpoint((async () => {__llmz_guard();try {__toolc__(0, "start");const __ret__ = (__llmz_guard(), __llmz_checkpoint(await (__llmz_guard(), __llmz_checkpoint(ComputedTable.createTableRow(entry)))));__toolc__(0, "end", __ret__, false);return __ret__;} catch (err) {__toolc__(0, "end", err, true);__llmz_guard();const __newError = (__llmz_guard(), __llmz_checkpoint(new Error(err.message)));(__llmz_guard(), __newError.name = err.name || "Error");(__llmz_guard(), __newError.stack = err.stack + ("\\n" + __newError.stack));throw __newError;}})()))));
          }
          ;__comment__("Send a confirmation message to the user", 18);
          __track__(19);(__llmz_guard(), __llmz_checkpoint((() => {__llmz_guard();try {__toolc__(1, "start");const __ret__ = (__llmz_guard(), __llmz_checkpoint(chat.sendText({
            message: "I have successfully added the new persons: Fleur, Pikachu, Ash, and Misty to the computed table."
          })));__toolc__(1, "end", __ret__, false);return __ret__;} catch (err) {__toolc__(1, "end", err, false);__llmz_guard();const __newError = (__llmz_guard(), __llmz_checkpoint(new Error(err.message)));(__llmz_guard(), __newError.name = err.name || "Error");(__llmz_guard(), __newError.stack = err.stack + ("\\n" + __newError.stack));throw __newError;}})()));
        }
        
        ;__comment__("Execute the function to add the new entries", 24);
        __track__(25);(__llmz_guard(), __llmz_checkpoint(await ((__llmz_guard(), __llmz_checkpoint(await (__llmz_guard(), __llmz_checkpoint((async () => {__llmz_guard();try {__toolc__(2, "start");const __ret__ = (__llmz_guard(), __llmz_checkpoint(await (__llmz_guard(), __llmz_checkpoint(addNewEntries(newEntries)))));__toolc__(2, "end", __ret__, false);return __ret__;} catch (err) {__toolc__(2, "end", err, true);__llmz_guard();const __newError = (__llmz_guard(), __llmz_checkpoint(new Error(err.message)));(__llmz_guard(), __newError.name = err.name || "Error");(__llmz_guard(), __newError.stack = err.stack + ("\\n" + __newError.stack));throw __newError;}})())))))));"
    `)
  })
})

describe('hasTopLevelReturn', () => {
  it('detects a top-level return', () => {
    expect(hasTopLevelReturn('return { some: "value" }')).toBe(true)
    expect(hasTopLevelReturn('const x = await tool()\nreturn x')).toBe(true)
    expect(hasTopLevelReturn('if (ok) {\n  return 1\n}')).toBe(true)
    expect(hasTopLevelReturn('return')).toBe(true)
  })

  it('ignores return inside comments and strings', () => {
    expect(hasTopLevelReturn('// return the summary to the user\nawait tool()')).toBe(false)
    expect(hasTopLevelReturn('/* we return early here */\nawait tool()')).toBe(false)
    expect(hasTopLevelReturn('await sendEmail({ subject: "Please return the form" })')).toBe(false)
    expect(hasTopLevelReturn('const msg = `return to sender`')).toBe(false)
  })

  it('ignores return inside nested functions', () => {
    expect(hasTopLevelReturn('const pick = (m) => { return m.title }\nawait tool(pick)')).toBe(false)
    expect(hasTopLevelReturn('function helper() { return 42 }\nawait helper()')).toBe(false)
    expect(hasTopLevelReturn('const movies = list.filter((m) => { return m.year > 2000 })')).toBe(false)
    expect(hasTopLevelReturn('async function helper() { return 1 }\nreturn await helper()')).toBe(true)
  })

  it('falls back to a word-boundary match when the code cannot be parsed', () => {
    expect(hasTopLevelReturn('return {{{')).toBe(true)
    expect(hasTopLevelReturn('await tool({{{')).toBe(false)
  })

  it('handles empty code', () => {
    expect(hasTopLevelReturn('')).toBe(false)
  })
})
