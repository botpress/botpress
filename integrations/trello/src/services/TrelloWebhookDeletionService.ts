import { TrelloWebhookRepository } from 'src/repositories/TrelloWebhookRepository'

export class TrelloWebhookDeletionService {
  public constructor(private readonly webhookRepository: TrelloWebhookRepository) {}

  public async deleteWebhook(id: string): Promise<void> {
    await this.webhookRepository.deleteWebhook(id)
  }
}
