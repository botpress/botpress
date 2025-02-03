import 'dotenv/config'

import { Client } from '@botpress/client'
import { getExtendedClient } from '../src/bp-client'

export const getTestClient = () =>
  getExtendedClient(
    new Client({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    })
  )
