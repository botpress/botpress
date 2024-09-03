import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Card } from '../interfaces/entities/Card'
import { ICardCommentRepository } from '../interfaces/repositories/ICardCommentRepository'
import { ICardCommentCreationService } from '../interfaces/services/ICardCommentCreationService'
import { DIToken } from '../iocContainer'

@injectable()
export class TrelloCardCommentCreationService implements ICardCommentCreationService {
    constructor(
        @inject(DIToken.CardCommentRepository) private cardCommentRepository: ICardCommentRepository,
    ) { }

    async createComment(cardId: Card['id'], commentBody: string): Promise<string> {
        return await this.cardCommentRepository.createComment(cardId, commentBody)
    }
}
