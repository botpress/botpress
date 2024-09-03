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
            return await this.trelloClient.lists.getList({
                id: listId
            })
        } catch (error) {
            this.handleError(`getList for id ${listId}`, error)
        }
    }

    async getCardsInList(listId: List['id']): Promise<Card[]> {
        try {
            return await this.trelloClient.lists.getListCards({
                id: listId
            })
        } catch (error) {
            this.handleError(`getCardsInList for list ${listId}`, error)
        }
    }
}
