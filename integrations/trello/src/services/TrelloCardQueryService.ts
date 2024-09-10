import { TrelloCardRepository } from 'src/repositories/TrelloCardRepository'
import { TrelloListRepository } from 'src/repositories/TrelloListRepository'
import { List } from 'src/schemas/entities/List'
import { Card } from '../schemas/entities/Card'
import { nameCompare } from '../utils'

export class TrelloCardQueryService {
  public constructor(
    private readonly listRepository: TrelloListRepository,
    private readonly cardRepository: TrelloCardRepository
  ) {}

  public async getCardById(cardId: Card['id']): Promise<Card> {
    return await this.cardRepository.getCardById(cardId)
  }

  public async getCardsByDisplayName(listId: List['id'], cardName: Card['name']): Promise<Card[]> {
    const allCards = await this.listRepository.getCardsInList(listId)
    return allCards.filter((c) => nameCompare(c.name, cardName))
  }
}
