import { BotpressEvent, ChannelOutgoingHandler } from 'botpress-module-sdk';
export default class OutgoingHandler implements ChannelOutgoingHandler {
    readonly channel: string;
    processContentElement(element: any): Promise<BotpressEvent[]>;
}
//# sourceMappingURL=outgoing.d.ts.map