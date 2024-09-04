import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { List } from '../schemas/entities/List'
import { BaseRepository } from './BaseRepository'


@injectable()
export class TrelloListRepository extends BaseRepository implements IListRepository {
    constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
        super(trelloClient)
    }

    async getList(listId: List['id']): Promise<List> {
        try {
            const list: List = await this.trelloClient.lists.getList({
              id: listId,
            })

            return {
              id: list.id,
              name: list.name,
            }
        } catch (error) {
            this.handleError(`getList for id ${listId}`, error)
        }
    }

    async getCardsInList(listId: List['id']): Promise<Card[]> {
        try {
            const cards = await this.trelloClient.lists.getListCards({
              id: listId,
            })

            return cards.map((card) => ({
              id: card.id,
              name: card.name,
              description: card.desc,
              listId: card.idList,
              verticalPosition: card.pos,
            }))
        } catch (error) {
            this.handleError(`getCardsInList for list ${listId}`, error)
        }
    }
}
