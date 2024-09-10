import { TrelloListRepository } from 'src/repositories/trelloListRepository'
import { List } from 'src/schemas/entities/list'
import { Card } from '../schemas/entities/card'
import { nameCompare } from '../utils'

export class TrelloCardQueryService {
  public constructor(private readonly listRepository: TrelloListRepository) {}

  public async getCardsByDisplayName(listId: List['id'], cardName: Card['name']): Promise<Card[]> {
    const allCards = await this.listRepository.getCardsInList(listId)
    return allCards.filter((c) => nameCompare(c.name, cardName))
  }
}
