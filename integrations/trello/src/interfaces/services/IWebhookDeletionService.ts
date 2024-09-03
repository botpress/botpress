import { TrelloID } from 'src/schemas'

export type IWebhookDeletionService = {
  deleteWebhook(id: TrelloID): Promise<void>
}
