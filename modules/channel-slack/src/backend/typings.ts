import { SlackClient } from './client'

export interface Clients {
  [key: string]: SlackClient
}
