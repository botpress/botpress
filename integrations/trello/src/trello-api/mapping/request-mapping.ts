import type { Card } from 'definitions/schemas'
import { UpdateCard, CreateCard } from 'trello.js/out/api/parameters'

export namespace RequestMapping {
  export const mapUpdateCard = (card: Pick<Card, 'id'> & Partial<Card>): UpdateCard =>
    _keepOnlySetProperties({
      id: card.id,
      name: card.name,
      desc: card.description,
      idList: card.listId,
      pos: card.verticalPosition,
      closed: card.isClosed,
      dueComplete: card.isCompleted,
      due: card.dueDate,
      idLabels: card.labelIds,
      idMembers: card.memberIds,
    })

  export const mapCreateCard = (card: Pick<Card, 'listId' | 'name' | 'description'> & Partial<Card>): CreateCard =>
    _keepOnlySetProperties({
      name: card.name,
      desc: card.description,
      idList: card.listId,
      due: card.dueDate,
      idLabels: card.labelIds,
      idMembers: card.memberIds,
    })
}

export const _keepOnlySetProperties = <T extends Record<string, any>>(
  obj: T
): {
  [K in keyof T as undefined extends T[K] ? (T[K] extends undefined ? never : K) : K]: T[K]
} => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as any
