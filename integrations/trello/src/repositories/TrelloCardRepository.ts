import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { UpdateCard } from 'trello.js/out/api/parameters'
import { inject, injectable } from 'tsyringe'
import { ICardRepository } from '../interfaces/repositories/ICardRepository'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { keepOnlySetProperties } from '../utils'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloCardRepository extends BaseRepository implements ICardRepository {
    constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
        super(trelloClient)
    }

    async getCard(cardId: Card['id']): Promise<Card> {
        try {
            const card = await this.trelloClient.cards.getCard({
                id: cardId
            })

            return {
                id: card.id,
                name: card.name,
                description: card.desc,
                listId: card.idList,
                verticalPosition: card.pos,
            }
        } catch (error) {
            this.handleError(`getCard for id ${cardId}`, error)
        }
    }

    async createCard(card: Omit<Card, 'id' | 'verticalPosition'>): Promise<Card> {
        try {
            const newCard = await this.trelloClient.cards.createCard({
              idList: card.listId,
              name: card.name,
              desc: card.description,
            })

            return {
              id: newCard.id,
              name: newCard.name,
              description: newCard.desc,
              listId: newCard.idList,
              verticalPosition: newCard.pos,
            }
        } catch (error) {
            this.handleError('createCard', error)
        }
    }

    async updateCard(card: Pick<Card, 'id'> & Partial<Card>): Promise<Card> {
        try {
            const updatedCard = await this.trelloClient.cards.updateCard(
              keepOnlySetProperties({
                id: card.id,
                name: card.name,
                desc: card.description,
                idList: card.listId,
                pos: card.verticalPosition,
              }) as Pick<UpdateCard, 'id'>
            )

            return {
              id: updatedCard.id,
              name: updatedCard.name,
              description: updatedCard.desc,
              listId: updatedCard.idList,
              verticalPosition: updatedCard.pos,
            }
        } catch (error) {
            this.handleError(`updateCard for id ${card.id}`, error)
        }
    }
}
