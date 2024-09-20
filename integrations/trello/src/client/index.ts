import { TrelloClient, Models, Parameters } from 'trello.js'

export class TrelloApi {
  private _client: TrelloClient

  public constructor(apiKey: string, token: string) {
    this._client = new TrelloClient({
      key: apiKey,
      token,
    })
  }

  public async createCard(card: Parameters.CreateCard): Promise<Models.Card> {
    return await this._client.cards.createCard(card)
  }

  public async updateCard(card: Parameters.UpdateCard): Promise<Models.Card> {
    return await this._client.cards.updateCard(card)
  }

  public async addCommentToCard(comment: Parameters.AddCardComment): Promise<Models.Action> {
    return await this._client.cards.addCardComment(comment)
  }

  public async getMember(memberId: string): Promise<Models.Member> {
    return await this._client.members.getMember({ id: memberId })
  }

  public async getBoardMembers(boardId: string): Promise<Models.Member[]> {
    const members = await this._client.boards.getBoardMembers({ id: boardId })
    return members as Models.Member[]
  }
}
