# Botpress SDK

Official Botpress SDK for TypeScript. Made for building bots and integrations as code.

## Disclaimer ⚠️

This package is still in development and is not ready for production use. Use it at your own risk.

## Installation

```bash
npm install --save @botpress/sdk # for npm
yarn add @botpress/sdk # for yarn
pnpm add @botpress/sdk # for pnpm
```

## Usage

1. First, write your bot in a TypeScript file. For example, `src/index.ts`:

```ts
import { Bot, messages } from '@botpress/sdk'

const bot = new Bot({})

bot.message('', async ({ message, client, ctx }) => {
  log.info('Received message', message)

  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: `I'm a stub bot. You said: ${message.payload.text}`,
    },
  })
  console.log('text message sent')
})

export default bot
```

2. Then, you can run it locally:

```bash
bp serve --entry-point ./src/index.ts # using the botpress CLI

ts-node -e "import bot from './src'; void bot.serve()" # or using ts-node directly
```

3. Or, you can bundle it and deploy it to Botpress Cloud:

```bash
bp deploy --entry-point ./src/index.ts # using the botpress CLI

# or, using esbuild and the Botpress API
esbuild --bundle --target=es2019 --platform=node --format=cjs --outfile=bundle.js ./src/index.ts
code=$(cat bundle.js)
# call the Botpress API using curl or any other HTTP client
# see https://botpress.com/docs/api/#bot-update-bot
```
