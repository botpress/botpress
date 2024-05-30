# Botpress Client

Official Botpress HTTP client for TypeScript. Queries the [Botpress API](https://botpress.com/docs/api/).

## Installation

```bash
npm install --save @botpress/client # for npm
yarn add @botpress/client # for yarn
pnpm add @botpress/client # for pnpm
```

## Usage

```ts
import { Client, ClientOutputs } from '@botpress/client'

type Bot = ClientOutputs['listBots']['bots'][number]

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
