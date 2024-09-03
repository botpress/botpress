import { Card } from '../entities/Card'

export type ICardCreationService = {
    createCard(name: string, description: string, listName: string): Promise<Card>
}
