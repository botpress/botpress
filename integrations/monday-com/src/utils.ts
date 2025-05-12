import { Client as VanillaClient } from '@botpress/client'
import { Client } from '.botpress'

export const getVanillaClient = (client: Client): VanillaClient => (client as any)._client as VanillaClient
