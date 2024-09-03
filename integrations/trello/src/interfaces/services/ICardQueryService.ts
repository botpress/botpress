import { Card } from '../entities/Card'

export type ICardQueryService = {
    getCardByName(listName: string, cardName: string): Promise<Card>
}
