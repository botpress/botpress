import { google } from 'googleapis'
import * as bp from '.botpress'

export class GoogleChatClient {
  private chat: ReturnType<typeof google.chat>
  private ctx: bp.Context

  constructor(ctx: bp.Context) {
    const serviceAccount = JSON.parse(ctx.configuration.serviceAccountJson)

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/chat.bot'],
    })

    this.chat = google.chat({ version: 'v1', auth })
    this.ctx = ctx
  }

  async listSpaces() {
    const response = await this.chat.spaces.list()
    return response.data
  }

  async sendMessage(spaceId: string, text: string) {
    const cleanSpaceId = spaceId.replace(/^spaces\//, '')

    const requestBody = {
      text,
    }

    const response = await this.chat.spaces.messages.create({
      parent: `spaces/${cleanSpaceId}`,
      requestBody,
    })
    return response.data
  }
}

export const getClient = (ctx: bp.Context) => {
  return new GoogleChatClient(ctx)
}
