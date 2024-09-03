import { Board } from '../../schemas/entities/Board'
import { List } from '../../schemas/entities/List'

export type IListQueryService = {
  getListsByName(boardId: Board['id'], name: List['name']): Promise<List[]>
}
