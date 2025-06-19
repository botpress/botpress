import axios from "axios";
import {deleteHookResponseSchema, deleteHookResSchemaType, WebhookResponse} from "./entities/webhooks";
import {pipeDriveConfig, pipeDriveBaseUrl} from "./conf";

export const createWebhook = async function createWebhook(eventAction: string, eventObject: string, webhookUrl: string
): Promise<WebhookResponse> {

    const response = await axios.post<WebhookResponse>(
        `${pipeDriveBaseUrl}/webhooks`,
        {
            subscription_url: webhookUrl,
            event_action: eventAction,
            event_object: eventObject
        },
        {
            params: {
                api_token: pipeDriveConfig.apiKey,
            }
        }
    );
    return response.data;
}

export const deleteWebhook = async function deleteWebhook(webhookId: string): Promise<deleteHookResSchemaType> {
    let res = await axios.delete(
        `${pipeDriveBaseUrl}/webhooks/${webhookId}`,
        {
            params: {
                api_token: pipeDriveConfig.apiKey,
            }
        }
    );
    return deleteHookResponseSchema.parse(res.data)
}