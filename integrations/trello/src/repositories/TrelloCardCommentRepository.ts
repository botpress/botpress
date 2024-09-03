import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { ICardCommentRepository } from '../interfaces/repositories/ICardCommentRepository'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloCardCommentRepository extends BaseRepository implements ICardCommentRepository {
    constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
        super(trelloClient)
    }

    async createComment(cardId: Card['id'], commentBody: string): Promise<string> {
        try {
            const comment = await this.trelloClient.cards.addCardComment({
                id: cardId,
                text: commentBody
            })

            return comment.id!
        } catch (error) {
            this.handleError(`createComment for card id ${cardId}`, error)
        }
    }
}
