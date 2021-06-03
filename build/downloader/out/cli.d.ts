import 'bluebird-global';
import { CommonArgs } from 'index';
export declare const toolsList: {
    nlu: {
        url: string;
    };
    studio: {
        url: string;
    };
};
export declare const initProject: (packageLocation: string, common: CommonArgs) => Promise<void>;
export declare const listFiles: ({ platform, appData, output }: CommonArgs) => Promise<void>;
export declare const cleanFiles: (storageLocation: string) => Promise<void>;
export declare const installFile: (toolName: string, common: CommonArgs, toolVersion?: string | undefined) => Promise<void>;
export declare const useFile: (toolName: string, version: string, common: CommonArgs) => Promise<void>;
