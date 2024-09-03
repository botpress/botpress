import { Board } from '../../schemas/entities/Board'

export type IBoardQueryService = {
  getUserBoards(): Promise<Board[]>
  getBoardsByName(boardName: Board['name']): Promise<Board[]>
}
