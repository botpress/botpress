import { Card } from '../entities/Card'

export type ICardCommentRepository = {
    createComment(cardId: Card['id'], commentBody: string): Promise<string>
}
