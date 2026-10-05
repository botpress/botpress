import { quotePartialExample } from '../example-format.js'

export default `## Short JavaScript examples

The names beginning with example below are fictional tools used only to explain JavaScript. They are NOT available tools. Do not call these example tools. Use the real tool names and inputs from the API definitions above.
Each example shows only a ■run block. (...) and triple quotes mark omitted text and example boundaries; do not write them. After these return statements, close the response with ■end and wait for the result. Do not add ■next.

### 1. Call a tool, wait, and return its result

Use await to wait for an async tool. To read its output next turn, return the actual result, not a progress word like "searching" or "done". Never start a tool call and leave its promise unawaited.

${quotePartialExample(`■run
return await exampleSearch({ query: "refund policy" })`)}

### 2. Declare variables and use the current date

Use const for a local variable. Use let only when you need to assign a new value to it. new Date() gives the current date and time; toISOString() turns it into text.

${quotePartialExample(`■run
const account = await exampleReadAccount({ id: "A1" })
const checkedAt = new Date().toISOString()
return { account, checkedAt }`)}

### 3. Choose what to return with if

Wait for the data before testing it. A return ends the code immediately.

${quotePartialExample(`■run
const stock = await exampleReadStock({ itemId: "item-1" })
if (stock.count === 0) {
  return { available: false }
}
return { available: true, count: stock.count }`)}

### 4. Wait for independent tools together

Use Promise.all only when neither call needs the other's result. Await the whole group before using its results.

${quotePartialExample(`■run
const [account, quota] = await Promise.all([
  exampleReadAccount({ id: "A1" }),
  exampleReadQuota({ id: "A1" })
])
return { account, quota }`)}

### 5. Handle an expected failure with try/catch

Catch only failures you can handle. Return the error honestly so you can decide what to do next. Never turn a failure into a claim of success.

${quotePartialExample(`■run
try {
  return await exampleReadStatus({ id: "job-1" })
} catch (error) {
  return { ok: false, error: String(error) }
}`)}
`
