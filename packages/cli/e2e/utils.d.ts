export declare const sleep: (ms: number) => Promise<void>;
export declare class TmpDirectory {
    private _res;
    private _closed;
    static create(): TmpDirectory;
    private constructor();
    get path(): string;
    cleanup(): void;
}
export type RunCommandOptions = {
    workDir: string;
};
export type RunCommandOutput = {
    exitCode: number;
};
export declare const runCommand: (cmd: string, { workDir }: RunCommandOptions) => Promise<RunCommandOutput>;
export declare const npmInstall: ({ workDir }: RunCommandOptions) => Promise<RunCommandOutput>;
export declare const tscCheck: ({ workDir }: RunCommandOptions) => Promise<RunCommandOutput>;
export declare const fixBotpressDependencies: ({ workDir, target, }: {
    workDir: string;
    target: Record<string, string | undefined>;
}) => Promise<void>;
export declare const handleExitCode: ({ exitCode }: {
    exitCode: number;
}) => void;
export declare const getUUID: () => string;
