import { TrelloBoardRepository } from 'src/repositories/TrelloBoardRepository'
import { TrelloListRepository } from 'src/repositories/TrelloListRepository'
import { Board } from 'src/schemas/entities/Board'
import { Card } from 'src/schemas/entities/Card'
import { List } from '../schemas/entities/List'
import { nameCompare } from '../utils'

export class TrelloListQueryService {
  public constructor(
    private readonly boardRepository: TrelloBoardRepository,
    private readonly listRepository: TrelloListRepository
  ) {}

  public async getListById(listId: List['id']): Promise<List> {
    return await this.listRepository.getListById(listId)
  }

  public async getCardsInList(listId: List['id']): Promise<Card[]> {
    return await this.listRepository.getCardsInList(listId)
  }

  public async getListsByDisplayName(boardId: Board['id'], name: List['name']): Promise<List[]> {
    const allLists = await this.boardRepository.getListsInBoard(boardId)
    return allLists.filter((l) => nameCompare(l.name, name))
  }
}
