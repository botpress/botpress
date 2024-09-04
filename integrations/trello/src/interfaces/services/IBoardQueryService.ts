import { List } from 'src/schemas/entities/List'
import { Member } from 'src/schemas/entities/Member'
import { Board } from '../../schemas/entities/Board'

export type IBoardQueryService = {
  getUserBoards(): Promise<Board[]>
  getBoardsByDisplayName(boardName: Board['name']): Promise<Board[]>
  getBoardById(boardId: Board['id']): Promise<Board>
  getListsInBoard(boardId: Board['id']): Promise<List[]>
  getBoardMembers(boardId: Board['id']): Promise<Member[]>
  getBoardMembersByDisplayName(boardId: Board['id'], memberName: Member['fullName']): Promise<Member[]>
}
