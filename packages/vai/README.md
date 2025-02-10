# Vitest AI

**Vai** (stands for _Vitest + AI_) is a lightweight vitest extension that uses LLMs to do assertions.
The goal of this library is primarily to allow testing the output of LLMs like the new autonomous engine, as the output is dynamic and qualitative we can't rely on traditional hard-coded tests.

To remove the flakiness and human-input from these tests, we need LLMs.

It's built on top of Zui and the Botpress client to interface with the different LLMs.

## Usage

```typescript
import { check, rate, filter, extract } from '@botpress/vai'
import { describe, test } from 'vitest'

describe('my test suite', () => {
  test('example', () => {
    check('botpress', 'is a chatbot company').toBe(true)
  })
})
```

## `check (assertion)`

Checks that the provided value matches the provided condition

```typescript
test('example', () => {
  // works with strings
  check('hello', 'is a greeting message').toBe(true)

  // also works with objects, arrays etc..
  check(
    {
      message: 'hello my friend',
      from: 'user',
    },
    'is a greeting message'
  ).toBe(true)
})
```

## `extract (assertion)`

Extracts from anything in input the requested Zui Schema:

```typescript
const person = z.object({
  name: z.string(),
  age: z.number().optional(),
  country: z.string().optional(),
})

extract('My name is Sylvain, I am 33 yo and live in Canada', person).toMatchObject({
  name: 'Sylvain',
  age: 33,
  country: 'Canada',
})
```

Also added support for `toMatchInlineSnapshot`:

```typescript
test('toMatchInlineSnapshot', () => {
  extract('My name is Eric!', z.object({ name: z.string() })).toMatchInlineSnapshot(`
    {
      "name": "Eric",
    }
  `)
})
```

## `filter (assertion)`

Filters an array of anything `T[]` based on a provided condition:

```typescript
const countries = ['canada', 'germany', 'usa', 'paris', 'mexico']
filter(countries, 'is in north america').toBe(['canada', 'usa', 'mexico'])
filter(countries, 'is the name of a country').length.toBe(4)
```

## `rate (assertion)`

Given any input `T`, gives a rating between `1` (worst) and `5` (best):

```typescript
test('good', () => rate('ghandi', 'is a good person').toBeGreaterThanOrEqual(4))
test('evil', () => rate('hitler', 'is a good person').toBe(3))
```

## Few-shot Examples

All assertion methods accept examples to provide the LLM with few-shot learning and help increase the accuracy.

```typescript
describe('learns from examples', () => {
  test('examples are used to understand how to classify correctly', () => {
    const examples = [
      {
        expected: true,
        value: 'Rasa the chatbot framework',
        reason: 'Rasa is a chatbot framework, so it competes with Botpress',
      },
      {
        expected: false,
        value: 'Rasa the coffee company',
        reason: 'Since Rasa is a coffee company, it does not compete with Botpress which is not in the coffee business',
      },
    ]

    check('Voiceflow', 'is competitor', { examples }).toBe(true)
    check('Toyota', 'is competitor', { examples }).toBe(false)
  })
})
```

## Failure Messages

All model predictions have nice failure messages by default:

```typescript
const countries = ['canada', 'germany', 'usa', 'paris', 'mexico']
filter(countries, 'is in north america').toBe(['canada', 'usa'])
```

## Promises

All assertion methods can also be used outside Vitest tests, as they return an `PromiseLike<T>` object that can be awaited.

```typescript
test('test truth', async () => {
  const { result } = await check('hello', 'is a greeting message')
  expect(result).toBe(true)
})
```

## Bail on failure

You can await the assertion to bail immediately on failure and prevent other test cases to run:

```typescript
test('no bail', () => {
  check('hello', 'is a greeting message').toBe(false)
  console.log('this will run as the above is not awaited, it will bail at the end of the test')
})

test('bail', async () => {
  await check('hello', 'is a greeting message').toBe(false)
  console.log('this will not run, the test has bailed')
})
```

## Changing the evaluator model

By default, GPT-4o mini is used to evaluate the tests, but the evaluator can be changed from inside a test:

```typescript
test('simple', () => {
  setEvaluator('anthropic__claude-3-5-sonnet-20240620')
  rate('hello', 'is a greeting message').toBe(5)
})
```
