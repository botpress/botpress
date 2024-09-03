import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type ICardQueryService = {
  getCardsByName(listId: List['id'], cardName: Card['name']): Promise<Card[]>
}
