import 'reflect-metadata'
import { Board } from 'src/schemas/entities/Board'
import { inject, injectable } from 'tsyringe'
import { IWebhookRepository } from '../interfaces/repositories/IWebhookRepository'
import { IWebhookCreationService } from '../interfaces/services/IWebhookCreationService'
import { DIToken } from '../iocContainer'

@injectable()
export class TrelloWebhookCreationService implements IWebhookCreationService {
  public constructor(@inject(DIToken.WebhookRepository) private webhookRepository: IWebhookRepository) {}

  public async createWebhook(description: string, url: string, trelloBoardId: Board['id']): Promise<string> {
    const newWebhook = await this.webhookRepository.createWebhook(description, url, trelloBoardId)

    return newWebhook
  }
}
