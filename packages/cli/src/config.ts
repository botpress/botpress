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
  default: process.cwd(),
} satisfies CommandOption

const noBuild = {
  type: 'boolean',
  description: 'Skip the build step',
  default: false,
} satisfies CommandOption

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

const integrationRef = {
  type: 'string',
  description: 'The integration ID or name with optionnal version. Ex: teams or teams@0.2.0',
  demandOption: true,
  positional: true,
  idx: 0,
} satisfies CommandOption

const sourceMap = { type: 'boolean', description: 'Generate sourcemaps', default: false } satisfies CommandOption

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
  entryPoint: { type: 'string', description: 'The entry point of the project', default: consts.defaultEntrypoint },
  outDir: { type: 'string', description: 'The output directory', default: consts.defaultOutputFolder },
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
} satisfies CommandSchema

const buildSchema = {
  ...projectSchema,
  sourceMap,
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
  createNewBot: { type: 'boolean', description: 'Create a new bot when deploying. Only used when deploying a bot' },
  sourceMap,
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
  port,
  tunnelUrl: {
    type: 'string',
    description: 'The tunnel HTTP URL to use',
    default: consts.defaultTunnelUrl,
  },
} satisfies CommandSchema

const addSchema = {
  ...projectSchema,
  ...credentialsSchema,
  integrationRef,
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
  version: { type: 'string', description: 'The version filter when listing integrations' },
} satisfies CommandSchema

const deleteIntegrationSchema = {
  ...globalSchema,
  ...credentialsSchema,
  integrationRef,
} satisfies CommandSchema

const initSchema = {
  ...globalSchema,
  workDir,
  type: { type: 'string', choices: ['bot', 'integration'] as const },
  name: { type: 'string', description: 'The name of the project' },
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
  init: initSchema,
  generate: generateSchema,
  bundle: bundleSchema,
  build: buildSchema,
  serve: serveSchema,
  deploy: deploySchema,
  add: addSchema,
  dev: devSchema,
} as const
