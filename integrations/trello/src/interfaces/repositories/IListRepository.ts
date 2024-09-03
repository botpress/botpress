import { Card } from '../entities/Card'
import { List } from '../entities/List'

export type IListRepository = {
    getList(listId: List['id']): Promise<List>
    getCardsInList(listId: List['id']): Promise<Card[]>
}
