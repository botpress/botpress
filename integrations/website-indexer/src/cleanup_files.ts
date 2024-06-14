import { Client } from '@botpress/client'
import { ListFilesResponse } from '@botpress/client/dist/gen/operations/listFiles'

async function main() {
  const client = new Client({ botId: '440b140e-ea55-4312-bd13-9efdfa01b29f', token: process.env.BOTPRESS_TOKEN })

  for await (const file of iterFiles(client)) {
    await client.deleteFile({ id: file.id })
  }
}

async function* iterFiles(client: Client) {
  let nextToken: string | undefined = undefined

  do {
    const files: ListFilesResponse = await client.listFiles({ nextToken })
    for (const file of files.files) {
      yield file
    }

    nextToken = files.meta.nextToken
  } while (nextToken)
}

void main()
