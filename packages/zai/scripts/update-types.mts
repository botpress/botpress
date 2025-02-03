import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'

import { maxBy } from 'lodash-es'
import fs from 'node:fs'
import path from 'node:path'

const Interfaces = ['llm'] as const

const client = new Client({
  apiUrl: process.env.CLOUD_API_ENDPOINT,
  botId: process.env.CLOUD_BOT_ID,
  token: process.env.CLOUD_PAT
})

for (const name of Interfaces) {
  const { interfaces } = await client.listInterfaces({
    name
  })

  const { interface: latest } = await client.getInterface({
    id: maxBy(interfaces, 'version')!.id
  })

  for (const action of Object.keys(latest.actions)) {
    const references = Object.keys(latest.entities).reduce((acc, key) => {
      return { ...acc, [key]: z.fromJsonSchema(latest.entities?.[key]?.schema!) }
    }, {})
    const input = latest.actions[action]?.input.schema!
    const output = latest.actions[action]?.output.schema!

    const types = `
// This file is generated. Do not edit it manually.
// See 'scripts/update-models.ts'

/* eslint-disable */
/* tslint:disable */

export namespace ${name} {
    export namespace ${action} {
      export ${z.fromJsonSchema(input).title('Input').dereference(references).toTypescript({ declaration: 'type' })};
      export ${z.fromJsonSchema(output).title('Output').dereference(references).toTypescript({ declaration: 'type' })};
    }
}`

    fs.mkdirSync(path.resolve(`./src/sdk-interfaces/${name}`), { recursive: true })
    fs.writeFileSync(path.resolve(`./src/sdk-interfaces/${name}/${action}.ts`), types)
  }
}
