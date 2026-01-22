import * as consts from './consts'
import { getStrings } from './locales'
import { ProjectTemplates } from './project-templates'
import type { CommandOption, CommandSchema } from './typings'

// Функция для создания схем с локализованными описаниями
function createSchemas() {
  const t = getStrings()

  // command options
  const port = {
    type: 'number',
    description: t.options.port,
  } satisfies CommandOption

  const workDir = {
    type: 'string',
    description: t.options.workDir,
    default: consts.defaultWorkDir,
  } satisfies CommandOption

  const noBuild = {
    type: 'boolean',
    description: t.options.noBuild,
    default: false,
  } satisfies CommandOption

  const dryRun = {
    type: 'boolean',
    description: t.options.dryRun,
    default: false,
  } as const satisfies CommandOption

  const apiUrl = {
    type: 'string',
    description: t.options.apiUrl,
  } satisfies CommandOption

  const token = {
    type: 'string',
    description: t.options.token,
  } satisfies CommandOption

  const workspaceId = {
    type: 'string',
    description: t.options.workspaceId,
  } satisfies CommandOption

  const secrets = {
    type: 'string',
    description: t.options.secrets,
    array: true,
    default: [],
  } satisfies CommandOption

  const botRef = {
    type: 'string',
    description: t.options.botRef,
    demandOption: true,
    positional: true,
    idx: 0,
  } satisfies CommandOption

  const packageRef = {
    type: 'string',
    description: t.options.packageRef,
    positional: true,
    idx: 0,
  } satisfies CommandOption

  const integrationRef = {
    ...packageRef,
    demandOption: true,
    description: t.options.integrationRef,
  } satisfies CommandOption

  const interfaceRef = {
    ...packageRef,
    demandOption: true,
    description: t.options.interfaceRef,
  } satisfies CommandOption

  const pluginRef = {
    ...packageRef,
    demandOption: true,
    description: t.options.pluginRef,
  } satisfies CommandOption

  const sourceMap = { type: 'boolean', description: t.options.sourceMap, default: false } satisfies CommandOption

  const minify = { type: 'boolean', description: t.options.minify, default: true } satisfies CommandOption

  const dev = {
    type: 'boolean',
    description: t.options.dev,
    default: false,
  } satisfies CommandOption

  // base schemas

  const globalSchema = {
    verbose: {
      type: 'boolean',
      description: t.options.verbose,
      alias: 'v',
      default: false,
    },
    confirm: {
      type: 'boolean',
      description: t.options.confirm,
      alias: 'y',
      default: false,
    },
    json: {
      type: 'boolean',
      description: t.options.json,
      default: false,
    },
    botpressHome: {
      type: 'string',
      description: t.options.botpressHome,
      default: consts.defaultBotpressHome,
    },
    profile: {
      type: 'string',
      description: t.options.profile,
      alias: 'p',
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
    botId: { type: 'string', description: t.options.botId },
    noBuild,
    dryRun,
    createNewBot: { type: 'boolean', description: t.options.createNewBot },
    sourceMap,
    minify,
    visibility: {
      type: 'string',
      choices: ['public', 'private', 'unlisted'] as const,
      description: t.options.visibility,
      default: 'private',
    },
    public: {
      type: 'boolean',
      description: t.options.publicDeprecated,
      default: false,
      deprecated: true,
    } satisfies CommandOption,
    allowDeprecated: {
      type: 'boolean',
      description: t.options.allowDeprecated,
      default: false,
    },
  } as const satisfies CommandSchema

  const devSchema = {
    ...projectSchema,
    ...credentialsSchema,
    ...secretsSchema,
    sourceMap,
    minify,
    port,
    tunnelUrl: {
      type: 'string',
      description: t.options.tunnelUrl,
      default: consts.defaultTunnelUrl,
    },
    tunnelId: {
      type: 'string',
      description: t.options.tunnelId,
    },
  } satisfies CommandSchema

  const addSchema = {
    ...globalSchema,
    ...credentialsSchema,
    packageRef,
    installPath: {
      type: 'string',
      description: t.options.installPath,
      default: consts.defaultInstallPath,
    },
    useDev: {
      type: 'boolean',
      description: t.options.useDev,
      default: false,
    },
    alias: {
      type: 'string',
      description: t.options.alias,
    },
  } satisfies CommandSchema

  const removeSchema = {
    ...globalSchema,
    ...credentialsSchema,
    workDir,
    alias: { idx: 0, positional: true, type: 'string', description: t.options.alias },
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
    name: { type: 'string', description: t.options.name },
    ifNotExists: {
      type: 'boolean',
      description: t.options.ifNotExists,
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
    name: { type: 'string', description: t.options.nameFilter },
    versionNumber: { type: 'string', description: t.options.versionFilter },
    owned: { type: 'boolean', description: t.options.owned },
    public: { type: 'boolean', description: t.options.public },
    limit: { type: 'number', description: t.options.limit },
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
    name: { type: 'string', description: t.options.nameFilter },
    versionNumber: { type: 'string', description: t.options.versionFilter },
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
    template: {
      type: 'string',
      choices: ProjectTemplates.getAllChoices(),
      description: t.options.template,
    },
    name: { type: 'string', description: t.options.name },
  } satisfies CommandSchema

  const lintSchema = {
    ...projectSchema,
  } satisfies CommandSchema

  const chatSchema = {
    ...globalSchema,
    ...credentialsSchema,
    chatApiUrl: {
      type: 'string',
      description: t.options.chatApiUrl,
    },
    botId: {
      type: 'string',
      positional: true,
      idx: 0,
      description: t.options.botId,
    },
  } satisfies CommandSchema

  const listProfilesSchema = {
    ...globalSchema,
  } satisfies CommandSchema

  const activeProfileSchema = {
    ...globalSchema,
  } satisfies CommandSchema

  const useProfileSchema = {
    ...globalSchema,
    profileToUse: {
      type: 'string',
      description: t.options.profileToUse,
      positional: true,
      idx: 0,
    },
  } satisfies CommandSchema

  return {
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
    remove: removeSchema,
    dev: devSchema,
    lint: lintSchema,
    chat: chatSchema,
    listProfiles: listProfilesSchema,
    activeProfile: activeProfileSchema,
    useProfile: useProfileSchema,
  } as const
}

// Экспортируем схемы (инициализируются при первом импорте)
export const schemas = createSchemas()
