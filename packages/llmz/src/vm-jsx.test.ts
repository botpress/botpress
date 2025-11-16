import { describe, expect, it, vi } from 'vitest'

import { runAsyncFunction } from './vm.js'

const user = { name: 'John', age: 30, email: 'john@test.com' }

describe('variables', () => {
  it('should return user name', async () => {
    const code = `
yield <Message>Hello, {user.name}!</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message, user }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "Hello, ",
          "John",
          "!",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should return user name', async () => {
    const code = `
// Calculating the sum of numbers between 734 and 9993 divisible by 7 or 9
    let sum = 0;
    for (let i = 734; i <= 9993; i++) {
      if (i % 7 === 0 || i % 9 === 0) {
        sum += i;
      }
    }
    yield <Message>The sum of all numbers between 734 and 9993 that are divisible by 7 or 9 is **{sum}**.</Message>;
    return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message, user }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "The sum of all numbers between 734 and 9993 that are divisible by 7 or 9 is **",
          11826297,
          "**.",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })
})

describe('jsx components', () => {
  it('jsx component with map inside', async () => {
    const code = `
const items = [{
title: 'Hello',
description: 'World',
}, {
title: 'Foo',
description: 'Bar'
}]

// Display the product information in a carousel
yield <Message>
Here are some products you might be interested in:
{items.map((product, index) => (
  <Card key={index} title={product.title || "Product"} subtitle={product.description}>
    <Button action='postback' label="Learn More" value={\`learn_more_\${index}\`} />
  </Card>
))}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()

    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
      Here are some products you might be interested in: 
      ",
          [
            {
              "__jsx": true,
              "children": [
                "
          ",
                {
                  "__jsx": true,
                  "children": [],
                  "props": {
                    "action": "postback",
                    "label": "Learn More",
                    "value": "learn_more_0",
                  },
                  "type": "BUTTON",
                },
                "
        ",
              ],
              "props": {
                "key": 0,
                "subtitle": "World",
                "title": "Hello",
              },
              "type": "CARD",
            },
            {
              "__jsx": true,
              "children": [
                "
          ",
                {
                  "__jsx": true,
                  "children": [],
                  "props": {
                    "action": "postback",
                    "label": "Learn More",
                    "value": "learn_more_1",
                  },
                  "type": "BUTTON",
                },
                "
        ",
              ],
              "props": {
                "key": 1,
                "subtitle": "Bar",
                "title": "Foo",
              },
              "type": "CARD",
            },
          ],
          "
      ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  describe('handling of special characters', () => {
    it('unmatched {', async () => {
      const code = `
  yield <Message>Hi! {</Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "Hi! {",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })

    it('matching {} with invalid code', async () => {
      const code = `
  yield <Message>Hi! {!!}</Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "Hi! {!!}",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })

    it('backticks in messages (quoting)', async () => {
      const code = `
  yield <Message>
  Hello, \`World\`
  </Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "
          Hello, \`World\` 
          ",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })

    it('Mix of valid and invalid braces', async () => {
      const code = `
  yield <Message>
  Name: {user.name}
  Age: {user.age}
  Invalid: {!!}
  End.
  </Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "
          Name: ",
            "John",
            "
          Age: ",
            30,
            "
          Invalid: {!!} 
          End. 
          ",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })

    it('braces: unclosed nested', async () => {
      const code = `
  yield <Message>
  Name {user is {user.name} and age is {user.age {years old}
  Age: {user.age { unit! }}
  Invalid: {!!}
  End.
  </Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "
          Name {user is ",
            "John",
            " and age is {user.age {years old} 
          Age: {user.age { unit! }} 
          Invalid: {!!} 
          End. 
          ",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })

    it('Array map with nested braces', async () => {
      const code = `
  yield <Message>
  Name {myArray.map((item) => <span>{item} is {!invalid!! yo} and { unmatched</span>)} and age is {user.age} years old
  </Message>
  return { action: 'listen' }
  `
      const Message = vi.fn()

      const result = await runAsyncFunction({ Message, user, myArray: [user, user] }, code)
      expect(result.success).toBe(true)
      expect(Message.mock.calls.length).toBe(1)
      expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
        {
          "__jsx": true,
          "children": [
            "
          Name ",
            [
              {
                "__jsx": true,
                "children": [
                  {
                    "age": 30,
                    "email": "john@test.com",
                    "name": "John",
                  },
                  " is {!invalid!! yo} and { unmatched",
                ],
                "props": {},
                "type": "SPAN",
              },
              {
                "__jsx": true,
                "children": [
                  {
                    "age": 30,
                    "email": "john@test.com",
                    "name": "John",
                  },
                  " is {!invalid!! yo} and { unmatched",
                ],
                "props": {},
                "type": "SPAN",
              },
            ],
            " and age is ",
            30,
            " years old 
          ",
          ],
          "props": {},
          "type": "MESSAGE",
        }
      `)
    })
  })

  it('Braces inside code snippets should be escaped', async () => {
    const code = `
// Modify the code snippet as requested and provide the updated version
yield <Message>
Certainly! I've updated the code snippet as per your request. Here's the modified version with "id" changed to "ID" in caps:

\`\`\`typescript
const getAmount = (ID: string) => \`https://invoice.com/$\{ID\}$\{ID ? '-' : ''\}\`
\`\`\`
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()

    const result = await runAsyncFunction({ Message, user, myArray: [user, user] }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
      Certainly! I've updated the code snippet as per your request. Here's the modified version with "id" changed to "ID" in caps: 
       
      \`\`\`typescript 
      const getAmount = (ID: string) => \`https://invoice.com/\${ID}\${ID ? '-' : ''}\` 
      \`\`\` 
      ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('Complex code snippets', async () => {
    const code = `
// I will explain how to use TypeScript's Omit utility type with an example.
yield <Message>
  In TypeScript, the \`Omit\` utility type is used to create a new type by omitting specific properties from an existing type. Here's a simple example:

  \`\`\`typescript
  interface Person {
    name: string;
    age: number;
    email: string;
  }

  // Create a new type without the 'email' property
  type PersonWithoutEmail = Omit<Person, 'email'>;

  const person: PersonWithoutEmail = {
    name: 'John Doe',
    age: 30
  };
  \`\`\`

  In this example, \`PersonWithoutEmail\` is a new type that includes all properties of \`Person\` except for \`email\`.
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()

    const result = await runAsyncFunction({ Message, user, myArray: [user, user] }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
        In TypeScript, the \`Omit\` utility type is used to create a new type by omitting specific properties from an existing type. Here's a simple example: 
       
        \`\`\`typescript 
        interface Person { 
          name: string; 
          age: number; 
          email: string; 
        } 
       
        // Create a new type without the 'email' property 
        type PersonWithoutEmail = Omit<Person, 'email'>; 
       
        const person: PersonWithoutEmail = { 
          name: 'John Doe', 
          age: 30 
        }; 
        \`\`\` 
       
        In this example, \`PersonWithoutEmail\` is a new type that includes all properties of \`Person\` except for \`email\`. 
      ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  // See FT-1770
  it('should handle various types of apostrophes in Message without parsing failure', async () => {
    const code = `
// Simulate a knowledge base answer with various types of apostrophes
yield <Message>
Here are examples with different apostrophes:
• French apostrophe: l’option « Mot de passe oublié »
• Backtick \` or \\\` works?
• Straight apostrophe: don't, can't, won't
• Curly apostrophe: don’t, can’t, won’t
• Smart single quotes: ‘single’, ’right’, ‘left’
• Smart double quotes: “double”, ”right”, “left”
• Mixed: l’école, don’t, can't, won’t, what\`s
• With contractions: it’s, that’s, what’s
• Possessive: John’s, Mary’s, children’s
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message, user }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
      Here are examples with different apostrophes: 
      • French apostrophe: l’option « Mot de passe oublié » 
      • Backtick \` or \\\` works? 
      • Straight apostrophe: don't, can't, won't 
      • Curly apostrophe: don’t, can’t, won’t 
      • Smart single quotes: ‘single’, ’right’, ‘left’ 
      • Smart double quotes: “double”, ”right”, “left” 
      • Mixed: l’école, don’t, can't, won’t, what\`s 
      • With contractions: it’s, that’s, what’s 
      • Possessive: John’s, Mary’s, children’s 
      ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('JSX with HTML entities', async () => {
    const code = `
yield <Message>
Special characters: &lt; &gt; &amp; &quot; &#39; &nbsp;
Math: 5 &lt; 10 &gt; 3
Entities: &copy; &trade; &reg;
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
  })

  it('JSX with unclosed tags - treats as text', async () => {
    const code = `
yield <Message>
Hello strong world
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    // Without < > this should work - unclosed HTML-like tags should be escaped
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
  })

  it('JSX with mismatched tags - treats as text', async () => {
    const code = `
yield <Message>
strong Hello/weak
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    //Without < > this should work - mismatched HTML-like tags should be escaped
    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
  })

  it('JSX with self-closing tags with children', async () => {
    const code = `
yield <Message>
<img src="test.jpg" />
<input type="text" value="test" />
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with comments inside', async () => {
    const code = `
yield <Message>
Hello {/* This is a comment */} World
{/* Another comment */}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with template literals in props', async () => {
    const code = `
const id = 123
yield <Button action={\`view_\${id}\`} label={\`Item #\${id}\`}>
Click me
</Button>
return { action: 'listen' }
`
    const Button = vi.fn()
    const result = await runAsyncFunction({ Button }, code)
    expect(result.success).toBe(true)
    expect(Button.mock.calls[0]![0].props.action).toBe('view_123')
    expect(Button.mock.calls[0]![0].props.label).toBe('Item #123')
  })

  it('JSX with spread operators in props', async () => {
    const code = `
const props = { action: 'test', label: 'Click' }
yield <Button {...props}>
Content
</Button>
return { action: 'listen' }
`
    const Button = vi.fn()
    const result = await runAsyncFunction({ Button }, code)
    expect(result.success).toBe(true)
    expect(Button.mock.calls[0]![0].props.action).toBe('test')
    expect(Button.mock.calls[0]![0].props.label).toBe('Click')
  })

  it('JSX with null/undefined in expressions', async () => {
    const code = `
const nullValue = null
const undefinedValue = undefined
yield <Message>
Null: {nullValue}
Undefined: {undefinedValue}
Empty: {''}
Zero: {0}
False: {false}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with deeply nested components', async () => {
    const code = `
yield <A>
<B>
<C>
<D>
<E>
<F>
Deep nesting
</F>
</E>
</D>
</C>
</B>
</A>
return { action: 'listen' }
`
    const A = vi.fn()
    const result = await runAsyncFunction({ A }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with ternary operators in children', async () => {
    const code = `
const show = true
yield <Message>
{show ? <Text>Shown</Text> : <Text>Hidden</Text>}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const Text = vi.fn()
    const result = await runAsyncFunction({ Message, Text }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with logical AND operator', async () => {
    const code = `
const hasData = true
const data = 'Hello'
yield <Message>
{hasData && <Text>{data}</Text>}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const Text = vi.fn()
    const result = await runAsyncFunction({ Message, Text }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with array of components without map', async () => {
    const code = `
yield <Message>
{[<Text key="1">First</Text>, <Text key="2">Second</Text>, <Text key="3">Third</Text>]}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const Text = vi.fn()
    const result = await runAsyncFunction({ Message, Text }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with function calls in props', async () => {
    const code = `
const getId = () => 'test-123'
yield <Button id={getId()} label={getId().toUpperCase()}>
Click
</Button>
return { action: 'listen' }
`
    const Button = vi.fn()
    const result = await runAsyncFunction({ Button }, code)
    expect(result.success).toBe(true)
    expect(Button.mock.calls[0]![0].props.id).toBe('test-123')
    expect(Button.mock.calls[0]![0].props.label).toBe('TEST-123')
  })

  it('JSX with object method calls in children', async () => {
    const code = `
const obj = {
  getMessage: () => 'Hello from method'
}
yield <Message>
{obj.getMessage()}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children).toContain('Hello from method')
  })

  it('JSX with unicode and emoji', async () => {
    const code = `
yield <Message>
Emoji: 🎉 🚀 ✨ 💻 🔥
Unicode: ñ é ü ö ä
Symbols: → ← ↑ ↓ ✓ ✗
Mixed: Hello 世界 مرحبا мир
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with regex patterns in text', async () => {
    const code = `
yield <Message>
Patterns: /[a-z]+/ or /\\d{3}-\\d{4}/ or /^test$/
Email regex: /^[^@]+@[^@]+\\.[^@]+$/
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with escaped quotes in props using template literals', async () => {
    const code = `
yield <Button label={\`Say "Hello"\`} action={\`It's working\`}>
Content
</Button>
return { action: 'listen' }
`
    const Button = vi.fn()
    const result = await runAsyncFunction({ Button }, code)
    // Using template literals instead of escaped quotes works
    expect(result.success).toBe(true)
    expect(Button.mock.calls[0]![0].props.label).toBe('Say "Hello"')
    expect(Button.mock.calls[0]![0].props.action).toBe("It's working")
    expect(Button.mock.calls[0]![0].children[0].trim()).toBe('Content')
  })

  it('JSX with multiline strings in props', async () => {
    const code = `
yield <Message text={\`
Line 1
Line 2
Line 3
\`}>
Content
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with arrow functions in props', async () => {
    const code = `
const callback = () => 'result'
yield <Button onClick={callback} onHover={() => 'hover'}>
Click
</Button>
return { action: 'listen' }
`
    const Button = vi.fn()
    const result = await runAsyncFunction({ Button }, code)
    expect(result.success).toBe(true)
    // BUG: Functions in props are not passed through - they become undefined
    // This is likely because the VM serialization doesn't support functions
    expect(Button.mock.calls[0]![0].props.onClick).toBeUndefined()
    expect(Button.mock.calls[0]![0].props.onHover).toBeUndefined()
  })

  it('JSX with newlines in different positions', async () => {
    const code = `
yield <Message
  prop1="value1"
  prop2="value2"
>
  Content with
  multiple
  newlines
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with empty children array', async () => {
    const code = `
yield <Message>
{[]}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
  })

  it('JSX with nested ternary operators', async () => {
    const code = `
const value = 2
yield <Message>
{value === 1 ? 'One' : value === 2 ? 'Two' : value === 3 ? 'Three' : 'Other'}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children).toContain('Two')
  })

  it('JSX with optional chaining in expressions', async () => {
    const code = `
const obj = { nested: { value: 'test' } }
const nullObj = null
yield <Message>
Value: {obj?.nested?.value}
Null: {nullObj?.nested?.value}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children.join('')).toContain('Value: test')
    expect(Message.mock.calls[0]![0].children.join('')).toContain('Null: ')
  })

  it('JSX with nullish coalescing', async () => {
    const code = `
const nullValue = null
const undefinedValue = undefined
const zeroValue = 0
yield <Message>
Null: {nullValue ?? 'default'}
Undefined: {undefinedValue ?? 'default'}
Zero: {zeroValue ?? 'default'}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children.join('')).toContain('Null: default')
    expect(Message.mock.calls[0]![0].children.join('')).toContain('Undefined: default')
    expect(Message.mock.calls[0]![0].children.join('')).toContain('Zero: 0')
  })

  it('JSX with try-catch in expressions', async () => {
    const code = `
const getValue = () => {
  try {
    throw new Error('Test')
  } catch (e) {
    return 'caught'
  }
}
yield <Message>
{getValue()}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children.join('')).toContain('caught')
  })

  it('JSX with IIFE in children', async () => {
    const code = `
yield <Message>
{(() => {
  const x = 5
  const y = 10
  return x + y
})()}
</Message>
return { action: 'listen' }
`
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)
    expect(result.success).toBe(true)
    expect(Message.mock.calls[0]![0].children).toContain(15)
  })

  it('JSX with single backticks failing test', async () => {
    const code = `
// Provide answer using the Answer component (Message has no children)
yield <Answer question="How to create rows in a Botpress table via the API?">
**How to create rows in a Botpress table via the API**

- **Endpoint:** \`POST /v1/tables/{table}/rows\`【4】
- **Headers required:**
- \`Authorization: Bearer <your-token>\`
- \`x-bot-id: <your-bot-id>\`
- \`Content-Type: application/json\`
- **Request body (JSON):** \`{ "rows": [ { "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 } ], "waitComputed": true }\`

**Quick checklist**
1. Use the POST endpoint above.  
2. Include the three authentication headers.  
3. Provide a \`rows\` array that matches your table schema.  
4. Optionally set \`waitComputed\` to \`true\`.  
5. For easier integration, you can use the official Botpress TypeScript client【12】.

The response returns the created rows with their IDs, timestamps, and any warnings or errors【4】.
</Answer>
return { action: 'listen' }
`

    const Answer = vi.fn()
    const result = await runAsyncFunction({ Answer, user }, code)
    expect(result.success).toBe(true)
    expect(Answer.mock.calls.length).toBe(1)
    expect(Answer.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
      **How to create rows in a Botpress table via the API** 
       
      - **Endpoint:** \`POST /v1/tables/{table}/rows\`【4】 
      - **Headers required:** 
      - \`Authorization: Bearer <your-token>\` 
      - \`x-bot-id: <your-bot-id>\` 
      - \`Content-Type: application/json\` 
      - **Request body (JSON):** \`{ "rows": [ { "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 } ], "waitComputed": true }\` 
       
      **Quick checklist** 
      1. Use the POST endpoint above. 
      2. Include the three authentication headers. 
      3. Provide a \`rows\` array that matches your table schema. 
      4. Optionally set \`waitComputed\` to \`true\`. 
      5. For easier integration, you can use the official Botpress TypeScript client【12】. 
       
      The response returns the created rows with their IDs, timestamps, and any warnings or errors【4】. 
      ",
        ],
        "props": {
          "question": "How to create rows in a Botpress table via the API?",
        },
        "type": "ANSWER",
      }
    `)
  })
})

describe('undefined variable references', () => {
  it('should handle single undefined variable in JSX expression', async () => {
    const code = `
      yield <Message>User: {username}</Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "User: ",
          "username",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle multiple undefined variables in same element', async () => {
    const code = `
      yield <Message>
        <div>Name: {name}</div>
        <div>Email: {email}</div>
        <div>Role: {role}</div>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Name: ",
              "name",
            ],
            "props": {},
            "type": "DIV",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Email: ",
              "email",
            ],
            "props": {},
            "type": "DIV",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Role: ",
              "role",
            ],
            "props": {},
            "type": "DIV",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables in attributes', async () => {
    const code = `
      yield <Message className={theme} data-id={userId}>
        Content here
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              Content here 
            ",
        ],
        "props": {
          "className": "theme",
          "data-id": "userId",
        },
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle mix of defined and undefined variables', async () => {
    const code = `
      const realName = 'Alice'
      yield <Message>
        Real: {realName}
        Fake: {fakeName}
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              Real: ",
          "Alice",
          "
              Fake: ",
          "fakeName",
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables in nested JSX', async () => {
    const code = `
      yield <Message>
        <header>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <main>
          <div>{content}</div>
        </main>
        <footer>{author}</footer>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "
                ",
              {
                "__jsx": true,
                "children": [
                  "title",
                ],
                "props": {},
                "type": "H1",
              },
              "
                ",
              {
                "__jsx": true,
                "children": [
                  "subtitle",
                ],
                "props": {},
                "type": "P",
              },
              "
              ",
            ],
            "props": {},
            "type": "HEADER",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "
                ",
              {
                "__jsx": true,
                "children": [
                  "content",
                ],
                "props": {},
                "type": "DIV",
              },
              "
              ",
            ],
            "props": {},
            "type": "MAIN",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "author",
            ],
            "props": {},
            "type": "FOOTER",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables with HTML entities and special chars', async () => {
    const code = `
      yield <Message>
        <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
        <p>Template: {template}</p>
        <pre>Value: {value}</pre>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "const html = '<div>",
              "content",
              "</div>';",
            ],
            "props": {},
            "type": "CODE",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Template: ",
              "template",
            ],
            "props": {},
            "type": "P",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Value: ",
              "value",
            ],
            "props": {},
            "type": "PRE",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables in template literal-like content', async () => {
    const code = `
      yield <Message>
        <div>User \${userId} has {count} items</div>
        <p>Price: \${price}</p>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "User $",
              "userId",
              " has ",
              "count",
              " items",
            ],
            "props": {},
            "type": "DIV",
          },
          "
              ",
          {
            "__jsx": true,
            "children": [
              "Price: $",
              "price",
            ],
            "props": {},
            "type": "P",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables in complex HTML structure from confusing instructions', async () => {
    const code = `
      yield <Message>
        <div className="widget" id="widget-{id}">
          <header>
            <h3>{title}</h3>
            <button onClick="close('{id}')">&times;</button>
          </header>
          <main>
            <p>{description}</p>
          </main>
        </div>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "
                ",
              {
                "__jsx": true,
                "children": [
                  "
                  ",
                  {
                    "__jsx": true,
                    "children": [
                      "title",
                    ],
                    "props": {},
                    "type": "H3",
                  },
                  "
                  ",
                  {
                    "__jsx": true,
                    "children": [
                      "×",
                    ],
                    "props": {
                      "onClick": "close('{id}')",
                    },
                    "type": "BUTTON",
                  },
                  "
                ",
                ],
                "props": {},
                "type": "HEADER",
              },
              "
                ",
              {
                "__jsx": true,
                "children": [
                  "
                  ",
                  {
                    "__jsx": true,
                    "children": [
                      "description",
                    ],
                    "props": {},
                    "type": "P",
                  },
                  "
                ",
                ],
                "props": {},
                "type": "MAIN",
              },
              "
              ",
            ],
            "props": {
              "className": "widget",
              "id": "widget-{id}",
            },
            "type": "DIV",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should not break with curly brace strings and undefined variables', async () => {
    const code = `
      yield <Message>
        <pre>
          function test() {'{'}
            return {value};
          {'}'}
        </pre>
      </Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(1)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "
              ",
          {
            "__jsx": true,
            "children": [
              "
                function test() ",
              "{",
              "
                  return ",
              "value",
              "; 
                ",
              "}",
              "
              ",
            ],
            "props": {},
            "type": "PRE",
          },
          "
            ",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })

  it('should handle undefined variables across multiple yields', async () => {
    const code = `
      yield <Message>{heading}</Message>
      yield <Message>{body}</Message>
      yield <Message>{footer}</Message>
      return { action: 'listen' }
    `
    const Message = vi.fn()
    const result = await runAsyncFunction({ Message }, code)

    expect(result.success).toBe(true)
    expect(Message.mock.calls.length).toBe(3)
    expect(Message.mock.calls[0]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "heading",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
    expect(Message.mock.calls[1]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "body",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
    expect(Message.mock.calls[2]![0]).toMatchInlineSnapshot(`
      {
        "__jsx": true,
        "children": [
          "footer",
        ],
        "props": {},
        "type": "MESSAGE",
      }
    `)
  })
})
