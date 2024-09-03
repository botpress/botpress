import { Board } from '../../schemas/entities/Board'
import { List } from '../../schemas/entities/List'

export type IBoardRepository = {
  getAllBoards(): Promise<Board[]>
  getListsInBoard(boardId: Board['id']): Promise<List[]>
}
