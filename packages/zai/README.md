# Zui AI

**Zai** (stands for _Zui + AI_) is a lightweight utility library that uses AI to manipulate and generate Zui schemas and objects.

It's built on top of Zui and the Botpress client to interface with the different LLMs.

## Usage

```typescript
import Zai from '@botpress/zai'

const zai = new Zai({
  client: new Client({}), // your botpress client here
})
```

## Array

```typescript
await zai.filter(['cat', 'dog', 'carrot'], 'is an animal')

// Not implemented yet
// await zai.map(filtered, z.object({ animal: z.string(), name: z.string() }))
// await zai.sort(named, 'from most dangerous to least dangerous')
// await zai.cluster(named, 'based on color')
// await zai.append(named, 'another one')
```

## String

```typescript
await zai.text('a story about ....')
await zai.summarize(book)
await zai.rewrite('Hello, I am ...', 'make it longer')

// Not implemented yet
// await zai.rate(novel, ['is the novel good?', 'how creative is it?', 'quality of writing', 'is the ending good?'])
// await zai.label(tweet, [{ label: '' }])
// await zai.classify(tweet, [])
```

## Boolean

```typescript
await zai.check({ name: 'hey', bio: '...' }, 'contains insults')
```

## Object

```typescript
await zai.extract('My name is Sly and I am from Canada !', z.object({ name: z.string(), country: z.string() }))

// Not implemented yet
// await zai.extend({ name: 'Sylvain' }, z.object({ country: z.string() }))
// await zai.diff(before, after)
// await zai.edit(object, '')
```
