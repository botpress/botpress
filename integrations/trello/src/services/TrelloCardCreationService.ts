import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { ICardRepository } from '../interfaces/repositories/ICardRepository'
import { ICardCreationService } from '../interfaces/services/ICardCreationService'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'

@injectable()
export class TrelloCardCreationService implements ICardCreationService {
  public constructor(@inject(DIToken.CardRepository) private cardRepository: ICardRepository) {}

  public async createCard(name: string, description: string, listId: string): Promise<Card> {
    const card: Pick<Card, 'name' | 'description' | 'listId'> = {
      name,
      description,
      listId,
    } as const

    return await this.cardRepository.createCard(card)
  }
}
