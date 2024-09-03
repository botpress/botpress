import { Card } from '../entities/Card'

export type ICardRepository = {
    getCard(cardId: Card['id']): Promise<Card>
    createCard(card: Omit<Card, 'id' | 'verticalPosition'>): Promise<Card>
    updateCard(card: Pick<Card, 'id'> & Partial<Card>): Promise<Card>
}
