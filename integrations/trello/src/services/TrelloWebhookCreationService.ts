import { TrelloWebhookRepository } from 'src/repositories/TrelloWebhookRepository'
import { Board } from 'src/schemas/entities/Board'

export class TrelloWebhookCreationService {
  public constructor(private readonly webhookRepository: TrelloWebhookRepository) {}

  public async createWebhook(description: string, url: string, trelloBoardId: Board['id']): Promise<string> {
    const newWebhook = await this.webhookRepository.createWebhook(description, url, trelloBoardId)

    return newWebhook
  }
}
