import { Board } from '../entities/Board'
import { List } from '../entities/List'

export type IBoardRepository = {
    getAllBoards(): Promise<Board[]>
    getListsInBoard(boardId: Board['id']): Promise<List[]>
}
