import { Member } from 'src/schemas/entities/Member'
import { Board } from '../../schemas/entities/Board'
import { List } from '../../schemas/entities/List'

export type IBoardRepository = {
  getAllBoards(): Promise<Board[]>
  getBoardById(boardId: Board['id']): Promise<Board>
  getListsInBoard(boardId: Board['id']): Promise<List[]>
  getBoardMembers(boardId: Board['id']): Promise<Member[]>
}
