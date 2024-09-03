import { List } from '../entities/List'

export type IListQueryService = {
    getListByName(name: string): Promise<List>
}
