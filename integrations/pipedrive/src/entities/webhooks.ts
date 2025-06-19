import { z } from 'zod/v4';

export interface WebhookResponse {
    success: boolean;
    data: {
        id: number;
        subscription_url: string;
        event_action: string;
        event_object: string;
        [key: string]: any;
    };
}
export const deleteHookResponseSchema = z.object({
    status: z.string().default("n/a"),
    success: z.boolean().default(false)
})

export interface PipedriveWebhookMeta {
    v: number;
    action: string;
    object: string;
    id: number;
    company_id: number;
    user_id: number;
    host: string;
    timestamp: number;
}

export interface PipedriveWebhookPayload {
    v: number;
    matches_filters: {
        current: any[];
    };
    meta: PipedriveWebhookMeta;
}

export type deleteHookResSchemaType = z.infer<typeof deleteHookResponseSchema>;