import 'reflect-metadata'
import { ICardRepository } from 'src/interfaces/repositories/ICardRepository'
import { List } from 'src/schemas/entities/List'
import { inject, injectable } from 'tsyringe'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { ICardQueryService } from '../interfaces/services/ICardQueryService'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { nameCompare } from '../utils'

@injectable()
export class TrelloCardQueryService implements ICardQueryService {
  public constructor(
    @inject(DIToken.ListRepository) private listRepository: IListRepository,
    @inject(DIToken.CardRepository) private cardRepository: ICardRepository
  ) {}

  public async getCardById(cardId: Card['id']): Promise<Card> {
    return await this.cardRepository.getCardById(cardId)
  }

  public async getCardsByDisplayName(listId: List['id'], cardName: Card['name']): Promise<Card[]> {
    const allCards = await this.listRepository.getCardsInList(listId)
    return allCards.filter((c) => nameCompare(c.name, cardName))
  }
}
