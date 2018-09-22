import { BotpressAPI, ExtendedKnex, UserAPI } from 'botpress-module-sdk';
export default class WebchatDb {
    private bp;
    knex: ExtendedKnex;
    users: UserAPI;
    constructor(bp: BotpressAPI);
    getUserInfo(userId: any): Promise<{
        fullName: string;
        avatar_url: string | undefined;
    }>;
    initialize(): Promise<boolean>;
    appendUserMessage(botId: any, userId: any, conversationId: any, { type, text, raw, data }: {
        type: any;
        text: any;
        raw: any;
        data: any;
    }): Promise<{
        sent_on: Date;
        message_raw: any;
        message_data: any;
        id: any;
        conversationId: any;
        userId: any;
        full_name: string;
        avatar_url: string | undefined;
        message_type: any;
        message_text: any;
    }>;
    appendBotMessage(botName: any, botAvatar: any, conversationId: any, { type, text, raw, data }: {
        type: any;
        text: any;
        raw: any;
        data: any;
    }): Promise<{
        id: any;
        conversationId: any;
        userId: undefined;
        full_name: any;
        avatar_url: any;
        message_type: any;
        message_text: any;
        message_raw: any;
        message_data: any;
        sent_on: import("botpress-module-sdk/node_modules/@types/knex").Raw;
    } & {
        sent_on: Date;
        message_raw: any;
        message_data: any;
    }>;
    createConversation(botId: any, userId: any, { originatesFromUserMessage }?: {
        originatesFromUserMessage?: boolean | undefined;
    }): Promise<any>;
    getOrCreateRecentConversation(botId: string, userId: string, { originatesFromUserMessage }?: {
        originatesFromUserMessage?: boolean | undefined;
    }): Promise<any>;
    listConversations(userId: string, botId: string): Promise<any>;
    getConversation(userId: any, conversationId: any, botId: any): Promise<any>;
    getConversationMessages(conversationId: any, fromId?: string): PromiseLike<any>;
}
//# sourceMappingURL=db.d.ts.map