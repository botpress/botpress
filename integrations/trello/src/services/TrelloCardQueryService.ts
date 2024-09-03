import 'reflect-metadata'
import { List } from 'src/schemas/entities/List'
import { inject, injectable } from 'tsyringe'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { ICardQueryService } from '../interfaces/services/ICardQueryService'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { nameCompare } from '../utils'

@injectable()
export class TrelloCardQueryService implements ICardQueryService {
  constructor(@inject(DIToken.ListRepository) private listRepository: IListRepository) {}

  async getCardsByName(listId: List['id'], cardName: Card['name']): Promise<Card[]> {
    const allCards = await this.listRepository.getCardsInList(listId)
    return allCards.filter((c) => nameCompare(c.name, cardName))
  }
}
