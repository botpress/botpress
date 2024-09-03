import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { ICardCommentRepository } from '../interfaces/repositories/ICardCommentRepository'
import { ICardCommentCreationService } from '../interfaces/services/ICardCommentCreationService'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'

@injectable()
export class TrelloCardCommentCreationService implements ICardCommentCreationService {
    constructor(
        @inject(DIToken.CardCommentRepository) private cardCommentRepository: ICardCommentRepository,
    ) { }

    async createComment(cardId: Card['id'], commentBody: string): Promise<string> {
        return await this.cardCommentRepository.createComment(cardId, commentBody)
    }
}
