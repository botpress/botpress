# Botpress Cognitive Client

A utility client built on top of `@botpress/client` to call LLMs for TypeScript. Works in the browser and NodeJS.

## Installation

```bash
npm install --save @botpress/client @botpress/cognitive # for npm
yarn add @botpress/client @botpress/cognitive # for yarn
pnpm add @botpress/client @botpress/cognitive # for pnpm
```

## Basic Usage

```ts
import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'

const token = 'your-token'
const botId = 'your-bot-id'

const client = new Client({ token, botId })

const cognitive = new Cognitive({ client })

const response = await cognitive.generateContent({ messages: [{ role: 'user', content: 'Hello!' }] })
```

## Advanced

### Model Preferences

By default, cognitive will try to fetch your model preferences from the File API.
Model preferences is an ordered list of models for `best` and `fast` presets.
When making a request, you can specify a preset `best` (default), `fast` or a ModelRef (`integration:model-id`).

When a model or a provider is down, cognitive will:

1. mark the model as degraded if not already marked as such
2. if retries allow, retry the request on the next model in the preferences
3. save the preferences (degradation)

The model is marked as degraded for a duration of 5 minutes.

### Ranking Heuristic

When no model preferences are passed, the default ranking heuristic will be used to rank available models automatically for `best` and `fast` presets.
It will look at the tags, price and vendor to score each models and rank them.

See `src/models.ts` for more information on this heuristic.

### Aborting the request

```ts
const cognitive = new Cognitive({ client: new Client() })
const controller = new AbortController()

await cognitive.generateContent({
  messages: [],
  signal: controller.signal,
})
```

### Overriding Preferences Provider

If no provider is passed to Cognitive, we default to `RemoteModelProvider`, which uses the File API to store preferences and fetches models using the Botpress Client (`getBot` and `listLanguageModels` on each installed integrations).

You can pass your own Provider, simply create a class that extends our base provider.

This method is recommended if you need to instanciate the Cognitive client frequently (say in a serverless), as retrieving preferences incurs an initial ~500ms latency.
For serverless environments, we recommend you provide a static list of models or use caching.

```ts
import { Cognitive, ModelProvider } from '@botpress/cognitive'

export class CustomModelProvider extends ModelProvider {
  public fetchInstalledModels(): Promise<Model[]> {
    throw new Error('Not implemented')
  }

  public fetchModelPreferences(): Promise<ModelPreferences | null> {
    throw new Error('Not implemented')
  }

  public saveModelPreferences(preferences: ModelPreferences): Promise<void> {
    throw new Error('Not implemented')
  }

  public deleteModelPreferences(): Promise<void> {
    throw new Error('Not implemented')
  }
}

const provider = new CustomModelProvider()
const cognitive = new Cognitive({ client: new Client(), provider })
```

## Events

## Extensions

We provide two extension points (hooks) for cognitive that allows you to change the input or output of requests.
Hooks can be asynchronous and run sequentially when calling `next(err, value)`.
You can also shortcircuit the execution by calling `done(err, value)`.

```ts
const cognitive = new Cognitive({ client: new Client() })

cognitive.interceptors.request.use(async (err, req, next, done) => {
  // do whatever here
  next(null, req)
})
```
