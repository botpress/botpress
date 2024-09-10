import { TrelloBoardRepository } from 'src/repositories/TrelloBoardRepository'
import { List } from 'src/schemas/entities/List'
import { Member } from 'src/schemas/entities/Member'
import { Board } from '../schemas/entities/Board'
import { nameCompare } from '../utils'

export class TrelloBoardQueryService {
  public constructor(private readonly boardRepository: TrelloBoardRepository) {}

  public async getBoardMembersByDisplayName(boardId: Board['id'], memberName: Member['fullName']): Promise<Member[]> {
    const members = await this.boardRepository.getBoardMembers(boardId)
    return members.filter((m) => nameCompare(m.fullName, memberName))
  }

  public async getBoardById(boardId: Board['id']): Promise<Board> {
    return await this.boardRepository.getBoardById(boardId)
  }

  public async getListsInBoard(boardId: Board['id']): Promise<List[]> {
    return await this.boardRepository.getListsInBoard(boardId)
  }

  public async getBoardMembers(boardId: Board['id']): Promise<Member[]> {
    return await this.boardRepository.getBoardMembers(boardId)
  }

  public async getUserBoards(): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards
  }

  public async getBoardsByDisplayName(boardName: Board['name']): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards.filter((b) => nameCompare(b.name, boardName))
  }
}
