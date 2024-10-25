import os from 'os'
import pathlib from 'path'
import { CLI_ROOT_DIR } from './root'

// configurable

export const defaultBotpressHome = pathlib.join(os.homedir(), '.botpress')
export const defaultWorkDir = process.cwd()
export const defaultInstallPath = process.cwd()
export const defaultBotpressApiUrl = 'https://api.botpress.cloud'
export const defaultBotpressAppUrl = 'https://app.botpress.cloud'
export const defaultTunnelUrl = 'https://tunnel.botpress.cloud'

// not configurable

export const cliRootDir = CLI_ROOT_DIR
export const emptyBotDirName = 'empty-bot'
export const emptyIntegrationDirName = 'empty-integration'
export const helloWorldIntegrationDirName = 'hello-world'
export const webhookMessageIntegrationDirName = 'webhook-message'
export const installDirName = 'bp_modules'
export const outDirName = '.botpress'
export const distDirName = 'dist'

export const fromCliRootDir = {
  emptyBotTemplate: pathlib.join('templates', emptyBotDirName),
  emptyIntegrationTemplate: pathlib.join('templates', emptyIntegrationDirName),
  helloWorldIntegrationTemplate: pathlib.join('templates', helloWorldIntegrationDirName),
  webhookMessageIntegrationTemplate: pathlib.join('templates', webhookMessageIntegrationDirName),
}

export const fromHomeDir = {
  globalCacheFile: 'global.cache.json',
}

export const fromOutDir = {
  distDir: distDirName,
  outFile: pathlib.join(distDirName, 'index.js'),
  implementationDir: 'implementation',
  secretsDir: 'secrets',
  projectCacheFile: 'project.cache.json',
}

export const fromWorkDir = {
  integrationDefinition: 'integration.definition.ts',
  interfaceDefinition: 'interface.definition.ts',
  botDefinition: 'bot.definition.ts',
  entryPoint: pathlib.join('src', 'index.ts'),
  outDir: outDirName,
  distDir: pathlib.join(outDirName, fromOutDir.distDir),
  outFile: pathlib.join(outDirName, fromOutDir.outFile),
  implementationDir: pathlib.join(outDirName, fromOutDir.implementationDir),
  secretsDir: pathlib.join(outDirName, fromOutDir.secretsDir),
  projectCacheFile: pathlib.join(outDirName, fromOutDir.projectCacheFile),
}
