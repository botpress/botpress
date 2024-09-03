import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { IWebhookRepository } from '../interfaces/repositories/IWebhookRepository'
import { IBoardQueryService } from '../interfaces/services/IBoardQueryService'
import { IWebhookCreationService } from '../interfaces/services/IWebhookCreationService'
import { DIToken } from '../iocContainer'

@injectable()
export class TrelloWebhookCreationService implements IWebhookCreationService {
    constructor(
        @inject(DIToken.BoardQueryService) private boardQueryService: IBoardQueryService,
        @inject(DIToken.WebhookRepository) private webhookRepository: IWebhookRepository,
    ) { }

    async createWebhook(description: string, url: string): Promise<string> {
        const mainBoard = await this.boardQueryService.getMainBoard()

        const newWebhook = await this.webhookRepository.createWebhook(description, url, mainBoard.id)

        return newWebhook
    }
}
