import * as consts from './consts'
import type { CommandOption, CommandSchema } from './typings'

// command options

const port = {
  type: 'number',
  description: 'The port to use',
} satisfies CommandOption

const workDir = {
  type: 'string',
  description: 'The path to the project',
  default: consts.defaultWorkDir,
} satisfies CommandOption

const noBuild = {
  type: 'boolean',
  description: 'Skip the build step',
  default: false,
} satisfies CommandOption

const dryRun = {
  type: 'boolean',
  description: 'Ask the API not to perform the actual operation',
  default: false,
} as const satisfies CommandOption

const apiUrl = {
  type: 'string',
  description: 'The URL of the Botpress server',
} satisfies CommandOption

const token = {
  type: 'string',
  description: 'You Personal Access Token ',
} satisfies CommandOption

const workspaceId = {
  type: 'string',
  description: 'The Workspace Id to deploy to',
} satisfies CommandOption

const secrets = {
  type: 'string',
  description: 'Values for the integration secrets',
  array: true,
  default: [],
} satisfies CommandOption

const botRef = {
  type: 'string',
  description: 'The bot ID. Bot Name is not supported.',
  demandOption: true,
  positional: true,
  idx: 0,
} satisfies CommandOption

const packageType = {
  type: 'string',
  description:
    'Either an integration or an interface; helps disambiguate the package type in case both an integration and an interface have the same reference.',
  choices: ['integration', 'interface', 'plugin'] as const,
} satisfies CommandOption

const packageRef = {
  type: 'string',
  description:
    'The package ID or name with optional version. The package can be either an integration or an interface. Ex: teams, teams@0.2.0, llm@5.1.0',
  positional: true,
  idx: 0,
} satisfies CommandOption

const integrationRef = {
  ...packageRef,
  demandOption: true,
  description: 'The integration ID or name with optional version. Ex: teams or teams@0.2.0',
} satisfies CommandOption

const interfaceRef = {
  ...packageRef,
  demandOption: true,
  description: 'The interface ID or name and version. Ex: llm@5.1.0',
} satisfies CommandOption

const pluginRef = {
  ...packageRef,
  demandOption: true,
  description: 'The plugin ID or name and version. Ex: knowledge@0.0.1',
} satisfies CommandOption

const sourceMap = { type: 'boolean', description: 'Generate sourcemaps', default: false } satisfies CommandOption

const minify = { type: 'boolean', description: 'Minify the bundled code', default: true } satisfies CommandOption

const dev = {
  type: 'boolean',
  description: 'List only dev bots / dev integrations',
  default: false,
} satisfies CommandOption

const isPublic = {
  type: 'boolean',
  description: 'Weither or not to deploy the integration publicly',
  default: false,
} satisfies CommandOption

// base schemas

const globalSchema = {
  verbose: {
    type: 'boolean',
    description: 'Enable verbose logging',
    alias: 'v',
    default: false,
  },
  confirm: {
    type: 'boolean',
    description: 'Confirm all prompts',
    alias: 'y',
    default: false,
  },
  json: {
    type: 'boolean',
    description: 'Prevent logging anything else than raw json in stdout. Useful for piping output to other tools',
    default: false,
  },
  botpressHome: {
    type: 'string',
    description: 'The path to the Botpress home directory',
    default: consts.defaultBotpressHome,
  },
} satisfies CommandSchema

const projectSchema = {
  ...globalSchema,
  workDir,
} satisfies CommandSchema

const credentialsSchema = {
  apiUrl,
  workspaceId,
  token,
} satisfies CommandSchema

const secretsSchema = {
  secrets,
} satisfies CommandSchema

// command schemas

const generateSchema = {
  ...projectSchema,
} satisfies CommandSchema

const bundleSchema = {
  ...projectSchema,
  sourceMap,
  minify,
} satisfies CommandSchema

const buildSchema = {
  ...projectSchema,
  sourceMap,
  minify,
} satisfies CommandSchema

const readSchema = {
  ...projectSchema,
} satisfies CommandSchema

const serveSchema = {
  ...projectSchema,
  ...secretsSchema,
  port,
} satisfies CommandSchema

const deploySchema = {
  ...projectSchema,
  ...credentialsSchema,
  ...secretsSchema,
  botId: { type: 'string', description: 'The bot ID to deploy. Only used when deploying a bot' },
  noBuild,
  dryRun,
  createNewBot: { type: 'boolean', description: 'Create a new bot when deploying. Only used when deploying a bot' },
  sourceMap,
  minify,
  public: isPublic,
  allowDeprecated: {
    type: 'boolean',
    description: 'Allow deprecated features in the project',
    default: false,
  },
} satisfies CommandSchema

const devSchema = {
  ...projectSchema,
  ...credentialsSchema,
  ...secretsSchema,
  sourceMap,
  minify,
  port,
  tunnelUrl: {
    type: 'string',
    description: 'The tunnel HTTP URL to use',
    default: consts.defaultTunnelUrl,
  },
} satisfies CommandSchema

const addSchema = {
  ...globalSchema,
  ...credentialsSchema,
  packageRef,
  packageType,
  installPath: {
    type: 'string',
    description: 'The path where to install the package',
    default: consts.defaultInstallPath,
  },
  useDev: {
    type: 'boolean',
    description: 'If a dev version of the package is found, use it',
    default: false,
  },
} satisfies CommandSchema

const loginSchema = {
  ...globalSchema,
  token,
  workspaceId,
  apiUrl: { ...apiUrl, default: consts.defaultBotpressApiUrl },
} satisfies CommandSchema

const logoutSchema = {
  ...globalSchema,
} satisfies CommandSchema

const createBotSchema = {
  ...globalSchema,
  ...credentialsSchema,
  name: { type: 'string', description: 'The name of the bot to create' },
  ifNotExists: {
    type: 'boolean',
    description: 'Do not create if a bot with the same name already exists',
    default: false,
  },
} satisfies CommandSchema

const getBotSchema = {
  ...globalSchema,
  ...credentialsSchema,
  botRef,
} satisfies CommandSchema

const deleteBotSchema = {
  ...globalSchema,
  ...credentialsSchema,
  botRef,
} satisfies CommandSchema

const listBotsSchema = {
  ...globalSchema,
  ...credentialsSchema,
  dev,
} satisfies CommandSchema

const getIntegrationSchema = {
  ...globalSchema,
  ...credentialsSchema,
  integrationRef,
} satisfies CommandSchema

const listIntegrationsSchema = {
  ...globalSchema,
  ...credentialsSchema,
  name: { type: 'string', description: 'The name filter when listing integrations' },
  versionNumber: { type: 'string', description: 'The version filter when listing integrations' },
  dev,
} satisfies CommandSchema

const deleteIntegrationSchema = {
  ...globalSchema,
  ...credentialsSchema,
  integrationRef,
} satisfies CommandSchema

const getInterfaceSchema = {
  ...globalSchema,
  ...credentialsSchema,
  interfaceRef,
} satisfies CommandSchema

const listInterfacesSchema = {
  ...globalSchema,
  ...credentialsSchema,
} satisfies CommandSchema

const deleteInterfaceSchema = {
  ...globalSchema,
  ...credentialsSchema,
  interfaceRef,
} satisfies CommandSchema

const getPluginSchema = {
  ...globalSchema,
  ...credentialsSchema,
  pluginRef,
} satisfies CommandSchema

const listPluginsSchema = {
  ...globalSchema,
  ...credentialsSchema,
} satisfies CommandSchema

const deletePluginSchema = {
  ...globalSchema,
  ...credentialsSchema,
  pluginRef,
} satisfies CommandSchema

const initSchema = {
  ...globalSchema,
  workDir,
  type: { type: 'string', choices: ['bot', 'integration', 'plugin'] as const },
  name: { type: 'string', description: 'The name of the project' },
} satisfies CommandSchema

const lintSchema = {
  ...projectSchema,
} satisfies CommandSchema

const chatSchema = {
  ...globalSchema,
  ...credentialsSchema,
  chatApiUrl: {
    type: 'string',
    description: 'The URL of the chat server',
  },
  botId: {
    type: 'string',
    positional: true,
    idx: 0,
    description: 'The bot ID to chat with',
  },
} satisfies CommandSchema

// exports

export const schemas = {
  global: globalSchema,
  project: projectSchema,
  credentials: credentialsSchema,
  secrets: secretsSchema,
  login: loginSchema,
  logout: logoutSchema,
  createBot: createBotSchema,
  getBot: getBotSchema,
  deleteBot: deleteBotSchema,
  listBots: listBotsSchema,
  getIntegration: getIntegrationSchema,
  listIntegrations: listIntegrationsSchema,
  deleteIntegration: deleteIntegrationSchema,
  getInterface: getInterfaceSchema,
  listInterfaces: listInterfacesSchema,
  deleteInterface: deleteInterfaceSchema,
  getPlugin: getPluginSchema,
  listPlugins: listPluginsSchema,
  deletePlugin: deletePluginSchema,
  init: initSchema,
  generate: generateSchema,
  bundle: bundleSchema,
  build: buildSchema,
  read: readSchema,
  serve: serveSchema,
  deploy: deploySchema,
  add: addSchema,
  dev: devSchema,
  lint: lintSchema,
  chat: chatSchema,
} as const
