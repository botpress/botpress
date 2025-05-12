import { Client as VanillaClient } from '@botpress/client'
import { itemsTableSchema } from 'src/misc/custom-schemas'
import { Client } from '.botpress'

export const getVanillaClient = (client: Client): VanillaClient => (client as any)._client as VanillaClient

export const ensureMondayItemsTableExists = async (client: Client) =>
  await getVanillaClient(client).getOrCreateTable({
    table: 'MondayItemsTable',
    schema: itemsTableSchema.toJsonSchema({ target: 'jsonSchema7' }),
  })
