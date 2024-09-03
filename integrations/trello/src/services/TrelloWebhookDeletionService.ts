import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { IWebhookRepository } from '../interfaces/repositories/IWebhookRepository'
import { IWebhookDeletionService } from '../interfaces/services/IWebhookDeletionService'
import { DIToken } from '../iocContainer'

@injectable()
export class TrelloWebhookDeletionService implements IWebhookDeletionService {
    constructor(
        @inject(DIToken.WebhookRepository) private webhookRepository: IWebhookRepository,
    ) { }

    async deleteWebhook(id: string): Promise<void> {
        await this.webhookRepository.deleteWebhook(id)
    }
}
