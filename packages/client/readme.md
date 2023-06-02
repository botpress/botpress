# Botpress Client

Official Botpress HTTP client for TypeScript. Queries the [Botpress API](https://botpress.com/docs/api/).

## Disclaimer ⚠️

This package is still in development and is not ready for production use. Use it at your own risk.

## Installation

```bash
npm install --save @botpress/client # for npm
yarn add @botpress/client # for yarn
pnpm add @botpress/client # for pnpm
```

## Usage

```ts
import { Client } from '@botpress/client'

type ListBotsResponse = Awaited<ReturnType<Client['listBots']>>
type Bot = ListBotsResponse['bots'][number]

const main = async () => {
  const token = 'your-token'
  const workspaceId = 'your-workspace-id'
  const client = new Client({ token, workspaceId })

  const allBots: Bot[] = []
  let nextToken: string | undefined
  do {
    const resp = await client.listBots({ nextToken })
    nextToken = resp.meta.nextToken
    allBots.push(...resp.bots)
  } while (nextToken)

  console.log(allBots)
}
void main()
```
