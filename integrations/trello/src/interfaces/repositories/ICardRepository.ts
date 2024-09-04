import { Card } from '../../schemas/entities/Card'

export type ICardRepository = {
  getCardById(cardId: Card['id']): Promise<Card>
  createCard(card: Pick<Card, 'name' | 'description' | 'listId'>): Promise<Card>
  updateCard(card: Pick<Card, 'id'> & Partial<Card>): Promise<Card>
}
