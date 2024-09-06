import 'reflect-metadata'
import { TrelloID } from 'src/schemas'
import { Member } from 'src/schemas/entities/Member'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { DIToken } from '../iocContainer'
import { Board } from '../schemas/entities/Board'
import { List } from '../schemas/entities/List'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloBoardRepository extends BaseRepository implements IBoardRepository {
  public constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
    super(trelloClient)
  }

  public async getBoardMembers(boardId: Board['id']): Promise<Member[]> {
    try {
      const members: { id: TrelloID; fullName: string; username: string }[] =
        await this.trelloClient.boards.getBoardMembers({
          id: boardId,
        })

      return members.map((member) => ({
        id: member.id,
        username: member.username,
        fullName: member.fullName,
      }))
    } catch (error) {
      this.handleError(`getBoardMembers for board ${boardId}`, error)
    }
  }

  public async getBoardById(boardId: Board['id']): Promise<Board> {
    try {
      const board = await this.trelloClient.boards.getBoard({
        id: boardId,
      })

      return {
        id: board.id,
        name: board.name ?? '',
      }
    } catch (error) {
      this.handleError(`getBoardById for board ${boardId}`, error)
    }
  }

  public async getAllBoards(): Promise<Board[]> {
    try {
      const boards = await this.trelloClient.members.getMemberBoards({
        id: 'me',
      })

      return boards.map((board) => ({
        id: board.id,
        name: board.name ?? '',
      }))
    } catch (error) {
      this.handleError('getAllBoards', error)
    }
  }

  public async getListsInBoard(boardId: Board['id']): Promise<List[]> {
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
