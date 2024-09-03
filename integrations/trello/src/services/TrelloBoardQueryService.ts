import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Board } from '../interfaces/entities/Board'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { IBoardQueryService } from '../interfaces/services/IBoardQueryService'
import { TrelloConfig } from '../interfaces/TrelloConfig'
import { DIToken } from '../iocContainer'
import { nameCompare } from '../utils'

@injectable()
export class TrelloBoardQueryService implements IBoardQueryService {
    constructor(
        @inject(DIToken.TrelloConfig) private trelloConfig: TrelloConfig,
        @inject(DIToken.BoardRepository) private boardRepository: IBoardRepository,
    ) { }

    async getMainBoard(): Promise<Board> {
        const allBoards = await this.boardRepository.getAllBoards()
        const boardName = this.trelloConfig.boardName
        const board = allBoards.find(l => nameCompare(l.name, boardName))

        if (!board) {
            throw new Error(`Unable to find a board named "${boardName}". Please make sure the API token has access to this board`)
        }

        return board
    }
}
