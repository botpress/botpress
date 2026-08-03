import { Client } from '@botpress/client'
import { Context } from '../context'

export const setupClient = (client: Client) => {
  Context.setClient(client)
}
