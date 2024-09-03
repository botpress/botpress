export type IWebhookCreationService = {
    createWebhook(description: string, url: string): Promise<string>
}
