export type IWebhookRepository = {
    createWebhook(description: string, url: string, modelId: string): Promise<string>
    deleteWebhook(id: string): Promise<void>
}
