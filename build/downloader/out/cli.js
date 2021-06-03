"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFile = exports.installFile = exports.cleanFiles = exports.listFiles = exports.initProject = exports.toolsList = void 0;
require("bluebird-global");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const cli_progress_1 = __importDefault(require("cli-progress"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const download_1 = require("./download");
const utils_1 = require("./utils");
exports.toolsList = {
    nlu: {
        url: 'https://api.github.com/repos/botpress/nlu/releases'
    },
    studio: {
        url: 'https://api.github.com/repos/botpress/studio/releases'
    }
};
const initProject = async (packageLocation, common) => {
    var _a;
    if (!(await fs_extra_1.default.pathExists(packageLocation))) {
        return utils_1.logger.error(`Package.json not found at ${packageLocation}`);
    }
    const packageJson = await fs_extra_1.default.readJson(packageLocation);
    for (const toolName of Object.keys(exports.toolsList)) {
        const toolVersion = ((_a = packageJson[toolName]) === null || _a === void 0 ? void 0 : _a.version) || packageJson[toolName];
        if (!toolVersion) {
            utils_1.logger.info(`Version missing for tool ${toolName} in package.json`);
            continue;
        }
        const releases = await utils_1.getReleasedFiles(toolName, common.platform);
        const configVersion = releases.find(x => x.version.endsWith(toolVersion));
        if (!configVersion) {
            utils_1.logger.info("Version not found on the tool's release page");
            continue;
        }
        const location = path_1.default.resolve(common.appData, 'tools', toolName, configVersion === null || configVersion === void 0 ? void 0 : configVersion.fileName);
        if (await fs_extra_1.default.pathExists(location)) {
            await exports.useFile(toolName, toolVersion, common);
        }
        else {
            await exports.installFile(toolName, common, configVersion.version);
            await exports.useFile(toolName, configVersion.version, common);
        }
    }
};
exports.initProject = initProject;
const listFiles = async ({ platform, appData, output }) => {
    const getToolVersion = async (name) => {
        const toolPath = path_1.default.resolve(output, 'bin', platform === 'win32' ? `${name}.exe` : name);
        try {
            if (await fs_extra_1.default.pathExists(toolPath)) {
                const child = child_process_1.spawnSync(`${toolPath}`, ['--version']);
                return child.stdout.toString().trim();
            }
        }
        catch (err) { }
    };
    for (const toolName of Object.keys(exports.toolsList)) {
        const activeVersion = await getToolVersion(toolName);
        const releases = await utils_1.getReleasedFiles(toolName, platform);
        utils_1.logger.info('');
        utils_1.logger.info(`Available versions for "${toolName}"`);
        for (const release of releases) {
            const location = path_1.default.resolve(appData, 'tools', toolName, release.fileName);
            const isInstalled = await fs_extra_1.default.pathExists(location);
            const isUsed = activeVersion && release.version.endsWith(activeVersion);
            utils_1.logger.info(`  ${release.version} ${isInstalled ? '[installed]' : ''} ${isUsed ? '[currently used in this workspace]' : ''}`);
        }
    }
    utils_1.logger.info('');
    utils_1.logger.info('Type `yarn bpd init` to download & use binaries configured in package.json');
    utils_1.logger.info('Type `yarn bpd install <toolName>` to install the latest version');
    utils_1.logger.info('Type `yarn bpd use <toolName> <version>` to copy that specific version in the current workspace');
    utils_1.logger.info('Type `yarn bpd clean` to remove all binaries');
};
exports.listFiles = listFiles;
const cleanFiles = async (storageLocation) => {
    try {
        const folder = path_1.default.resolve(storageLocation, 'tools');
        await Promise.fromCallback(cb => rimraf_1.default(folder, cb));
        utils_1.logger.info('Botpress Tools successfully removed');
    }
    catch (err) {
        utils_1.logger.error(`Couldn't clean files ${err}`);
    }
};
exports.cleanFiles = cleanFiles;
const installFile = async (toolName, common, toolVersion) => {
    if (!exports.toolsList[toolName]) {
        return utils_1.logger.error('Invalid tool name');
    }
    const releases = await utils_1.getReleasedFiles(toolName, common.platform);
    const release = !toolVersion ? releases[0] : releases.find(x => x.version.endsWith(toolVersion));
    if (!release) {
        return utils_1.logger.error("Specified version doesn't exist.");
    }
    const { version, fileName, downloadUrl } = release;
    const destination = path_1.default.resolve(common.appData, 'tools', toolName, fileName);
    utils_1.logger.info(`Downloading file from ${downloadUrl}`);
    utils_1.logger.info(`Output file is ${destination}`);
    const downloadProgressBar = new cli_progress_1.default.Bar({
        format: `${chalk_1.default.green(utils_1.APP_PREFIX)} Downloading ${toolName} ${version}... [{bar}] ({percentage}%), {duration}s`,
        stream: process.stdout,
        noTTYOutput: true
    });
    downloadProgressBar.start(100, 0);
    try {
        await download_1.downloadFile(release.downloadUrl, destination, (p) => {
            downloadProgressBar.update(p * 100);
        });
        downloadProgressBar.update(100);
        await fs_extra_1.default.chmod(destination, '766'); // user: rwx, group: rw, others: rw
    }
    finally {
        downloadProgressBar.stop();
    }
};
exports.installFile = installFile;
const useFile = async (toolName, version, common) => {
    const toolFolder = path_1.default.resolve(common.appData, 'tools', toolName);
    const underscoreVersion = version.replace(/\./g, '_');
    const matchingFile = await Promise.fromCallback(cb => glob_1.default(`*${underscoreVersion}-${common.platform.replace('win32', 'win')}*`, { cwd: toolFolder }, cb));
    if (!matchingFile.length) {
        return utils_1.logger.error('Version not found');
    }
    const fileName = matchingFile[0];
    const srcFile = path_1.default.resolve(toolFolder, fileName);
    const destPath = path_1.default.resolve(common.output, 'bin', common.platform === 'win32' ? `${toolName}.exe` : toolName);
    if (await fs_extra_1.default.pathExists(destPath)) {
        utils_1.logger.info('Removing existing binary...');
        await fs_extra_1.default.unlink(destPath);
    }
    await fs_extra_1.default.copy(srcFile, destPath);
    utils_1.logger.info(`Now using ${fileName}`);
};
exports.useFile = useFile;
//# sourceMappingURL=cli.js.map