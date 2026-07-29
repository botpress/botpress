import { Client } from '@botpress/client'
import { Context } from '../context.js'

export const setupClient = (client: Client) => {
  Context.setClient(client)
}
