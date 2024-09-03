import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { DIToken } from '../iocContainer'
import { List } from '../interfaces/entities/List'
import { IBoardRepository } from '../interfaces/repositories/IBoardRepository'
import { IBoardQueryService } from '../interfaces/services/IBoardQueryService'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { nameCompare } from '../utils'

@injectable()
export class TrelloListQueryService implements IListQueryService {
    constructor(
        @inject(DIToken.BoardQueryService) private boardQueryService: IBoardQueryService,
        @inject(DIToken.BoardRepository) private boardRepository: IBoardRepository,
    ) { }

    async getListByName(name: string): Promise<List> {
        const board = await this.boardQueryService.getMainBoard()
        const lists = await this.boardRepository.getListsInBoard(board.id)
        const list = lists.find(l => nameCompare(l.name, name))

        if (!list) {
            throw new Error(`Unable to find a list named "${name}" in board ${board.name}`)
        }

        return list
    }
}
