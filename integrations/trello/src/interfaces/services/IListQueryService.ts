import { Card } from 'src/schemas/entities/Card'
import { Board } from '../../schemas/entities/Board'
import { List } from '../../schemas/entities/List'

export type IListQueryService = {
  getListsByDisplayName(boardId: Board['id'], name: List['name']): Promise<List[]>
  getListById(listId: List['id']): Promise<List>
  getCardsInList(listId: List['id']): Promise<Card[]>
}
