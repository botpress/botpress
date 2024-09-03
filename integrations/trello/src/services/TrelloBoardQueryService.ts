import 'reflect-metadata'
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

  async getUserBoards(): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards
  }

  async getBoardsByName(boardName: Board['name']): Promise<Board[]> {
    const allBoards = await this.boardRepository.getAllBoards()
    return allBoards.filter((b) => nameCompare(b.name, boardName))
  }
}
