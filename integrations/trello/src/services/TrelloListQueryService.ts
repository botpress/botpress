import 'reflect-metadata'
import { Board } from 'src/schemas/entities/Board'
import { inject, injectable } from 'tsyringe'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { DIToken } from '../iocContainer'
import { List } from '../schemas/entities/List'
import { nameCompare } from '../utils'

@injectable()
export class TrelloListQueryService implements IListQueryService {
  constructor(@inject(DIToken.BoardRepository) private boardRepository: IBoardRepository) {}

  async getListsByName(boardId: Board['id'], name: List['name']): Promise<List[]> {
    const allLists = await this.boardRepository.getListsInBoard(boardId)
    return allLists.filter((l) => nameCompare(l.name, name))
  }
}
