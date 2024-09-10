import { TrelloID } from 'src/schemas'
import { Card } from '../schemas/entities/card'
import { List } from '../schemas/entities/list'
import { BaseRepository } from './baseRepository'

export class TrelloListRepository extends BaseRepository {
  public async getListById(listId: List['id']): Promise<List> {
    try {
      const list: List = await this.trelloClient.lists.getList({
        id: listId,
      })

      return {
        id: list.id,
        name: list.name,
      }
    } catch (error) {
      this.handleError(`getList for id ${listId}`, error)
    }
  }

  public async getCardsInList(listId: List['id']): Promise<Card[]> {
    try {
      const cards = await this.trelloClient.lists.getListCards({
        id: listId,
      })

      return cards.map((card) => ({
        id: card.id,
        name: card.name,
        description: card.desc,
        listId: card.idList,
        verticalPosition: card.pos,
        dueDate: card.due ?? undefined,
        isClosed: card.closed,
        isCompleted: card.dueComplete,
        labelIds: card.idLabels as TrelloID[],
        memberIds: card.idMembers as TrelloID[],
      }))
    } catch (error) {
      this.handleError(`getCardsInList for list ${listId}`, error)
    }
  }
}
