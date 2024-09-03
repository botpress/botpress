import { Board } from '../entities/Board'

export type IBoardQueryService = {
    getMainBoard(): Promise<Board>
}
