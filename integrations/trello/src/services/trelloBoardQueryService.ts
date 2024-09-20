import { Board, Member } from 'definitions/schemas'
import { TrelloBoardRepository } from 'src/repositories/trelloBoardRepository'
import { nameCompare } from '../utils'

export class TrelloBoardQueryService {
  public constructor(private readonly _boardRepository: TrelloBoardRepository) {}

  public async getBoardMembersByDisplayName(boardId: Board['id'], memberName: Member['fullName']): Promise<Member[]> {
    const members = await this._boardRepository.getBoardMembers(boardId)
    return members.filter((m) => nameCompare(m.fullName, memberName))
  }

  public async getBoardsByDisplayName(boardName: Board['name']): Promise<Board[]> {
    const allBoards = await this._boardRepository.getAllBoards()
    return allBoards.filter((b) => nameCompare(b.name, boardName))
  }
}
