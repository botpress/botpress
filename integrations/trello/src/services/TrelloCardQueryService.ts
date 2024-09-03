import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Card } from '../interfaces/entities/Card'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { ICardQueryService } from '../interfaces/services/ICardQueryService'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { DIToken } from '../iocContainer'
import { nameCompare } from '../utils'

@injectable()
export class TrelloCardQueryService implements ICardQueryService {
    constructor(
        @inject(DIToken.ListQueryService) private listQueryService: IListQueryService,
        @inject(DIToken.ListRepository) private listRepository: IListRepository,
    ) { }

    async getCardByName(listName: string, cardName: string): Promise<Card> {
        const list = await this.listQueryService.getListByName(listName)
        const allCards = await this.listRepository.getCardsInList(list.id)
        const card = allCards.find(c => nameCompare(c.name, cardName))

        if (!card) {
            throw new Error(`Unable to find a card named "${cardName}" in list ${listName}`)
        }

        return card
    }
}
