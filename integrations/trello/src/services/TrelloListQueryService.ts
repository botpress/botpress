import 'reflect-metadata'
import { IListRepository } from 'src/interfaces/repositories/IListRepository'
import { Board } from 'src/schemas/entities/Board'
import { Card } from 'src/schemas/entities/Card'
import { inject, injectable } from 'tsyringe'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { DIToken } from '../iocContainer'
import { List } from '../schemas/entities/List'
import { nameCompare } from '../utils'

@injectable()
export class TrelloListQueryService implements IListQueryService {
  constructor(
    @inject(DIToken.BoardRepository) private boardRepository: IBoardRepository,
    @inject(DIToken.ListRepository) private listRepository: IListRepository
  ) {}

  async getListById(listId: List['id']): Promise<List> {
    return await this.listRepository.getListById(listId)
  }

  async getCardsInList(listId: List['id']): Promise<Card[]> {
    return await this.listRepository.getCardsInList(listId)
  }

  async getListsByDisplayName(boardId: Board['id'], name: List['name']): Promise<List[]> {
    const allLists = await this.boardRepository.getListsInBoard(boardId)
    return allLists.filter((l) => nameCompare(l.name, name))
  }
}
