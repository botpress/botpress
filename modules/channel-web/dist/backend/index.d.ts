/// <reference types="node" />
import 'bluebird-global';
import { BotpressAPI } from 'botpress-module-sdk';
export declare type Extension = {
    'channel-web': {};
};
export declare const onInit: (bp: BotpressAPI & Extension) => Promise<void>;
export declare const onReady: (bp: any) => Promise<void>;
export declare const config: {
    uploadsUseS3: {
        type: string;
        required: boolean;
        default: boolean;
        env: string;
    };
    uploadsS3Bucket: {
        type: string;
        required: boolean;
        default: string;
        env: string;
    };
    uploadsS3AWSAccessKey: {
        type: string;
        required: boolean;
        default: undefined;
        env: string;
    };
    uploadsS3Region: {
        type: string;
        required: boolean;
        default: undefined;
        env: string;
    };
    uploadsS3AWSAccessSecret: {
        type: string;
        required: boolean;
        default: undefined;
        env: string;
    };
    startNewConvoOnTimeout: {
        type: string;
        required: boolean;
        default: boolean;
        env: string;
    };
    recentConversationLifetime: {
        type: string;
        required: boolean;
        default: string;
        env: string;
    };
};
export declare const defaultConfigJson = "\n{\n  /************\n    Optional settings\n  *************/\n\n  \"uploadsUseS3\": false,\n  \"uploadsS3Bucket\": \"bucket-name\",\n  \"uploadsS3Region\": \"eu-west-1\",\n  \"uploadsS3AWSAccessKey\": \"your-aws-key-name\",\n  \"uploadsS3AWSAccessSecret\": \"secret-key\",\n  \"startNewConvoOnTimeout\": false,\n  \"recentConversationLifetime\": \"6 hours\"\n}\n";
export declare const serveFile: (filePath: string) => Promise<Buffer>;
//# sourceMappingURL=index.d.ts.map