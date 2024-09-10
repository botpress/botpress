import { TrelloCardRepository } from 'src/repositories/TrelloCardRepository'
import { Card } from '../schemas/entities/Card'

export class TrelloCardCreationService {
  public constructor(private readonly cardRepository: TrelloCardRepository) {}

  public async createCard(name: string, description: string, listId: string): Promise<Card> {
    const card: Pick<Card, 'name' | 'description' | 'listId'> = {
      name,
      description,
      listId,
    } as const

    return await this.cardRepository.createCard(card)
  }
}
