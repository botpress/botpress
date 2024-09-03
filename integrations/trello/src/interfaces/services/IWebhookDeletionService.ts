export type IWebhookDeletionService = {
    deleteWebhook(id: string): Promise<void>
}
