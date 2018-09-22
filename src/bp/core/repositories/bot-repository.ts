export interface BotRepository {
  getBotById(id: number): Promise<any>
}
