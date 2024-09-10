import { TrelloBoardRepository } from 'src/repositories/trelloBoardRepository'
import { Member } from 'src/schemas/entities/member'
import { Board } from '../schemas/entities/board'
import { nameCompare } from '../utils'

export class TrelloBoardQueryService {
  public constructor(private readonly boardRepository: TrelloBoardRepository) {}

  public async getBoardMembersByDisplayName(boardId: Board['id'], memberName: Member['fullName']): Promise<Member[]> {
    const members = await this.boardRepository.getBoardMembers(boardId)
    return members.filter((m) => nameCompare(m.fullName, memberName))
  }

  public async getBoardsByDisplayName(boardName: Board['name']): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards.filter((b) => nameCompare(b.name, boardName))
  }
}
