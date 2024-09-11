import { List, Card } from 'definitions/schemas'
import { TrelloListRepository } from 'src/repositories/trelloListRepository'
import { nameCompare } from '../utils'

export class TrelloCardQueryService {
  public constructor(private readonly listRepository: TrelloListRepository) {}

  public async getCardsByDisplayName(listId: List['id'], cardName: Card['name']): Promise<Card[]> {
    const allCards = await this.listRepository.getCardsInList(listId)
    return allCards.filter((c) => nameCompare(c.name, cardName))
  }
}
