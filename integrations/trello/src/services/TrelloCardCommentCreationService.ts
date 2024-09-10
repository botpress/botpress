import { TrelloCardCommentRepository } from 'src/repositories/TrelloCardCommentRepository'
import { Card } from '../schemas/entities/Card'

export class TrelloCardCommentCreationService {
  public constructor(private readonly cardCommentRepository: TrelloCardCommentRepository) {}

  public async createComment(cardId: Card['id'], commentBody: string): Promise<string> {
    return await this.cardCommentRepository.createComment(cardId, commentBody)
  }
}
