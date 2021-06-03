interface ProcessedRelease {
    version: string;
    fileName: string;
    fileSize: number;
    downloadUrl: string;
}
export declare const getReleasedFiles: (toolName: string, platform: string) => Promise<ProcessedRelease[]>;
export declare const getAppDataPath: () => string;
export declare const APP_PREFIX = "[BP Downloader]";
export declare const logger: {
    info: (log: string) => void;
    error: (log: string) => void;
};
export {};
