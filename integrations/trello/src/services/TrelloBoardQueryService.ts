import 'reflect-metadata'
import { List } from 'src/schemas/entities/List'
import { Member } from 'src/schemas/entities/Member'
import { inject, injectable } from 'tsyringe'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { IBoardQueryService } from '../interfaces/services/IBoardQueryService'
import { DIToken } from '../iocContainer'
import { TrelloConfig } from '../schemas/configuration'
import { Board } from '../schemas/entities/Board'
import { nameCompare } from '../utils'

@injectable()
export class TrelloBoardQueryService implements IBoardQueryService {
  constructor(
    @inject(DIToken.TrelloConfig) private trelloConfig: TrelloConfig,
    @inject(DIToken.BoardRepository) private boardRepository: IBoardRepository
  ) {}

  async getBoardMembersByDisplayName(boardId: Board['id'], memberName: Member['fullName']): Promise<Member[]> {
    const members = await this.boardRepository.getBoardMembers(boardId)
    return members.filter((m) => nameCompare(m.fullName, memberName))
  }

  async getBoardById(boardId: Board['id']): Promise<Board> {
    return await this.boardRepository.getBoardById(boardId)
  }

  async getListsInBoard(boardId: Board['id']): Promise<List[]> {
    return await this.boardRepository.getListsInBoard(boardId)
  }

  async getBoardMembers(boardId: Board['id']): Promise<Member[]> {
    return await this.boardRepository.getBoardMembers(boardId)
  }

  async getUserBoards(): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards
  }

  async getBoardsByDisplayName(boardName: Board['name']): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards.filter((b) => nameCompare(b.name, boardName))
  }
}
