import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type IListRepository = {
  getList(listId: List['id']): Promise<List>
  getCardsInList(listId: List['id']): Promise<Card[]>
}
