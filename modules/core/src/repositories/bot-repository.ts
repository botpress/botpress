export interface BotRepository {
  getBotById(id: string): Promise<any>
}
