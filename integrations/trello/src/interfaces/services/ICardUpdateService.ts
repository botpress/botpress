import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type ICardUpdateService = {
  moveCardVertically(cardId: Card['id'], nbPositions: number): Promise<void>
  moveCardToOtherList(cardId: Card['id'], newListId: List['id']): Promise<void>
}
