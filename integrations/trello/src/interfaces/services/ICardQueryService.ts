import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type ICardQueryService = {
  getCardsByDisplayName(listId: List['id'], cardName: Card['name']): Promise<Card[]>
  getCardById(cardId: Card['id']): Promise<Card>
}
