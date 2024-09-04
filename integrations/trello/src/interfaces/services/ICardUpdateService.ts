import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type CardModificationRequest = {
  bodyText: Card['description']
  closedState: 'open' | 'archived'
  completeState: 'complete' | 'incomplete'
  dueDate: Card['dueDate']
  labelsToAdd: Card['labelIds']
  labelsToRemove: Card['labelIds']
  membersToAdd: Card['memberIds']
  membersToRemove: Card['memberIds']
  name: Card['name']
}

export type ICardUpdateService = {
  moveCardVertically(cardId: Card['id'], nbPositions: number): Promise<void>
  moveCardToOtherList(cardId: Card['id'], newListId: List['id']): Promise<void>
  updateCard(cardId: Card['id'], modifications: Partial<CardModificationRequest>): Promise<void>
}
