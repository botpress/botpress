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
})
