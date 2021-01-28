# Coding Style

This page list recommendations and general rules so we can keep a clean and consistent codebase. Some of these rules could be enforced via TSLint, however to avoid refactoring too much of the codebase at the same time, we will add them gradually.

## General

- Less code = Simple code = Less bugs = Better code. Don't write code for the sake of writing code, try to keep it simple.

- Make sure your code is as resilient as possible, so when you make external calls or when something may throw, don't forget to wrap it in a try/catch block.

- Avoid code duplication. When you copy-paste a block of code, think of how you can refactor it to avoid having to duplicate the logic.

- Use newlines to group logically related pieces of code. A big block of code is harder to read. When that block of code grows, split it again with newlines. Make it easy for reviewers to check your code.

```js
doSomethingTo(x)
thenDoThisTo(x)

callSomethingElse(y)

thenEndWith(z)
```

- Only export methods and constants which are being used outside of your file / module / component

- Use optional chaining. It requires a lot less code to make a safe validation, and is an ideal replacement for `_.get()`

```js
// Do
props.variables?.list?.map()
// Instead of this
props.variables && props.variables.list && props.variables.list.map()
```

- Use strict equality (===) to ensure the check is exactly what is expected.

```js
console.log(1 === '1') // false
console.log(1 == '1') // true
// Because
console.log(1 + 1) // 2
console.log(1 + '1') // 11 = bug
```

- Use null coalescing (??) instead of || when possible. It will explicitly return the value to the right only if the value to the left is `undefined`.

```js
// Help prevent weird behavior when dealing with numbers or boolean, since false or 0 will return the other value
console.log(0 || 1) // returns 1
console.log(0 ?? 1) // returns 0
```

- Use vanilla JS methods when they are available. For example, use the native `.map` and `.forEach` instead of lodash' `_.map` and `_.forEach`

- Each variable are "undefined" when you don't assign a value to it. You don't need to declare it as being undefined.

## Naming

- Filenames: lowercase-with-dashes
- Variable and method names: lowerCamelCase
- Classes: PascalCase
- Constants: ALL_CAPS

## Variables

- Use native types when declaring your variables, ex: string[] instead of Array<string> and Date instead of Knex.Date

- Use `const` and `let` (which are block-scoped) instead of `var`

- When declaring constants, put them at the top of the file with an all-caps name (not as a class member). Ex: `const EVENTS_TO_KEEP = 10`

- Avoid adding information about the type of the variable in its name (ex: `const entryArray` - prefer a plural name like `const entries`)

## Methods

- Prefer short & clear names. Instead of `deleteTop10EntriesFromEventsTable`, use `pruneEntries`. The method names should be clear about what is happening, without being overly descriptive.

- Private methods and members should start with an underscore

## TYPINGS

- Avoid using `any` when a better typing can be used or created.

- When you change existing code where typings are missing, please add them so we get a better coverage of the codebase.

- Prefer to use `interface` instead of `type` when it is possible.

```js
interface BotConfig {
  id: string
}

// However to extend an existing object, use a type instead of "extending" the interface (it's more clear when you add multiple elements)
type NewConfig = BotConfig & { someValue: string }

// Use a question mark when the property can be undefined instead of the literal "undefined"
interface MyObj {
  someOptionalProp?: string // Do
  someOtherOptional: string | undefined // Don't
}
```

### Location of typings:

- When working on a module, each module should have a filed named `typings.d.ts` with the common typings for the module. This way, the backend and frontend can share those typings easily
- When the code you changed touches the Botpress SDK, related typings should go in `botpress.d.ts`. (avoid importing typings in that file)
- Typings that can be used everywhere except in the SDK can be put in `common/typings.ts`
- When developing a React component, put the properties typing in the same file, with the name `Props`

## ES6 Usage

ES6 brought a lot of goodies which help keep the code clearer. Here's a quick overview, but I suggest reading the [specifications here](http://es6-features.org)

- Use [Property shorthand](http://es6-features.org/#PropertyShorthand)

```js
const myMethod = (name: string, type: string) => {
  // Do
  return { id: '123', name, type, otherProp: '' }
  // Instead of
  return { id: '123', name: name, type: type, otherProp: '' }
}
```

- We recommend using [Arrow functions](http://es6-features.org/#ExpressionBodies) instead of function declaration (although sometimes a function is really necessary)
- Use [Template literals](http://es6-features.org/#StringInterpolation) to build a string instead of using the + sign
- Use [Destructuring](http://es6-features.org/#ObjectMatchingShorthandNotation) when you access multiple properties of an object.

```js
// Do (especially true if you use them often)
const { type, label, value } = option
return { text: type === 'say' ? value : label }

// Instead of
return { text: option.type === 'type' ? option.value : option.label }
```

- We recommend using Async/Await instead of then/catch.

```js
// Do
const { data } = await axios.get('/')

// Instead of
axios.get('/').then(data => {})
```

- Avoid mutating the original object as much as possible. This can lead to side effects and it's less clear on what happens

```js
const original = {
  name: string
}

// Do
return {
  ...original,
  name: newName
}

// Instead of
original.name = newName
return original
```

## Module Development

- Keep the main `index.ts` file as light as possible, so move the code in other files (ex: `client.ts` for a channel)

- API routes should be declared in a file named `api.ts`

- When the module access something on the database, put those requests in `db.ts`

## Other

- You do not need to await before returning a value (this would simply cause an unnecessary "double await")

```js
const someCall = async (): Promise<string> => {
  return knex.select('*')
}

// Since you await here, you don't need to "return await knex.select()".
const result = await someCall()
```

- When you have a big condition, try to invert it to keep a small indentation level. It helps readability in bigger methods

```js
// Do
const myMethod = (a, b) => {
  if (!a.someCondition) {
    return b
  }

  // 20 lines of code
  return a
}

// Instead of
const myMethod = (a, b) => {
  if (a.someCondition) {
    // 20 lines of code
    return a
  }

  return b
}
```

## Libraries

- When dealing with durations, use the `ms` library which converts human-readable string (ex: 30m) to its equivalent in millisecond
- Use `classnames` when playing with styles for react components instead of concatenating class names directly
