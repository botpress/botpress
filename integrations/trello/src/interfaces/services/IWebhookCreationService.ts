import { Board } from 'src/schemas/entities/Board'

export type IWebhookCreationService = {
  createWebhook(description: string, url: string, trelloBoardId: Board['id']): Promise<string>
}
