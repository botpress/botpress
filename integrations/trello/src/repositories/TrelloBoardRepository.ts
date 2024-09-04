import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { DIToken } from '../iocContainer'
import { Board } from '../schemas/entities/Board'
import { List } from '../schemas/entities/List'
import { BaseRepository } from './BaseRepository'


@injectable()
export class TrelloBoardRepository extends BaseRepository implements IBoardRepository {
    constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
        super(trelloClient)
    }

    async getAllBoards(): Promise<Board[]> {
        try {
            const boards = await this.trelloClient.members.getMemberBoards({
              id: 'me',
            })

            return boards.map((board) => ({
              id: board.id,
              name: board.name!,
            }))
        } catch (error) {
            this.handleError('getAllBoards', error)
        }
    }

    async getListsInBoard(boardId: Board['id']): Promise<List[]> {
        try {
            const lists = await this.trelloClient.boards.getBoardLists({
              id: boardId,
            })

            return lists.map((list) => ({
              id: list.id,
              name: list.name,
            }))
        } catch (error) {
            this.handleError(`getListsInBoard for board ${boardId}`, error)
        }
    }
}
