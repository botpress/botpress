import { Card } from '../../schemas/entities/Card'
import { List } from '../../schemas/entities/List'

export type ICardCreationService = {
  createCard(name: Card['name'], description: Card['description'], listId: List['id']): Promise<Card>
}
