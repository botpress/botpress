import type { List, Member, Board, TrelloID, Card } from 'definitions/schemas'
import { Models, type Models as TrelloJsModels } from 'trello.js'

export namespace ResponseMapping {
  export const mapMember = (member: TrelloJsModels.Member): Member => ({
    id: member.id ?? '',
    fullName: member.fullName ?? '',
    username: member.username ?? '',
  })

  export const mapBoard = (board: TrelloJsModels.Board): Board => ({
    id: board.id,
    name: board.name ?? '',
  })

  export const mapList = (list: TrelloJsModels.List): List => ({
    id: list.id,
    name: list.name,
  })

  export const mapTrelloId = (id?: Models.TrelloID): TrelloID => id ?? ''

  export const mapCard = (card: TrelloJsModels.Card): Card => ({
    id: card.id,
    name: card.name,
    description: card.desc,
    listId: card.idList,
    verticalPosition: card.pos,
    isClosed: card.closed,
    isCompleted: card.dueComplete,
    dueDate: card.due ?? undefined,
    labelIds: card.idLabels as TrelloID[],
    memberIds: card.idMembers as Member['id'][],
  })
}
