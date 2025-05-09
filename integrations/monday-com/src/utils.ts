import { Configuration } from '.botpress/implementation/typings/configuration'
import { Client } from '@botpress/client'
import { Client as EventClient } from '.botpress'
import axios, { Axios } from 'axios'

export const getVanillaClient = (botClient: EventClient): Client => (botClient as any)._client as Client

export const getClient = (config: Configuration): Axios =>
  axios.create({
    baseURL: 'https://api.monday.com/v2',
    timeout: 10_000,
    headers: {
      Authorization: config.personalAccessToken,
      'API-Version': '2023-07',
      'Content-Type': 'application/json',
    },
  })
