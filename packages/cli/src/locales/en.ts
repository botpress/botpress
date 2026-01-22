import type { LocaleStrings } from './types'

export const en: LocaleStrings = {
  // === Command descriptions ===
  commands: {
    login: 'Login to Botpress Cloud',
    logout: 'Logout of Botpress Cloud',
    bots: {
      description: 'Bot related commands',
      create: 'Create new bot',
      get: 'Get bot',
      delete: 'Delete bot',
      list: 'List bots',
    },
    integrations: {
      description: 'Integration related commands',
      get: 'Get integration',
      delete: 'Delete integration',
      list: 'List integrations',
    },
    interfaces: {
      description: 'Interface related commands',
      get: 'Get interface',
      delete: 'Delete interface',
      list: 'List interfaces',
    },
    plugins: {
      description: 'Plugin related commands',
      get: 'Get plugin',
      delete: 'Delete plugin',
      list: 'List plugins',
    },
    init: 'Initialize a new project',
    generate: 'Generate typings for intellisense',
    bundle: 'Bundle a botpress project',
    build: 'Generate typings and bundle a botpress project',
    read: 'Read and parse an integration definition',
    serve: 'Serve your project locally',
    deploy: 'Deploy your project to the cloud',
    add: 'Install a package; could be an integration or an interface',
    remove: "Remove a package from your project's dependencies",
    dev: 'Run your project in dev mode',
    lint: 'EXPERIMENTAL: Lint an integration definition',
    chat: 'EXPERIMENTAL: Chat with a bot directly from the CLI',
    profiles: {
      description: 'Commands for using CLI profiles',
      list: 'List all available profiles',
      active: 'Get the profile properties you are currently using',
      use: 'Set the current profile',
    },
  },

  // === Option descriptions ===
  options: {
    port: 'The port to use',
    workDir: 'The path to the project',
    noBuild: 'Skip the build step',
    dryRun: 'Ask the API not to perform the actual operation',
    apiUrl: 'The URL of the Botpress server',
    token: 'Your Personal Access Token',
    workspaceId: 'The Workspace Id to deploy to',
    secrets: 'Values for the integration secrets',
    botRef: 'The bot ID. Bot Name is not supported.',
    packageRef:
      'The package ID or name with optional version. The package can be either an integration or an interface. Ex: teams, teams@0.2.0, llm@5.1.0',
    integrationRef: 'The integration ID or name with optional version. Ex: teams or teams@0.2.0',
    interfaceRef: 'The interface ID or name and version. Ex: llm@5.1.0',
    pluginRef: 'The plugin ID or name and version. Ex: knowledge@0.0.1',
    sourceMap: 'Generate sourcemaps',
    minify: 'Minify the bundled code',
    dev: 'List only dev bots / dev integrations',
    verbose: 'Enable verbose logging',
    confirm: 'Confirm all prompts',
    json: 'Prevent logging anything else than raw json in stdout. Useful for piping output to other tools',
    botpressHome: 'The path to the Botpress home directory',
    profile: 'The CLI profile defined in the $BP_BOTPRESS_HOME/profiles.json',
    botId: 'The bot ID to deploy. Only used when deploying a bot',
    createNewBot: 'Create a new bot when deploying. Only used when deploying a bot',
    visibility:
      'The visibility of the project. By default, projects are always private. Unlisted visibility is only supported for integrations and plugins.',
    publicDeprecated: 'DEPRECATED: Please use "--visibility public" instead.',
    allowDeprecated: 'Allow deprecated features in the project',
    tunnelUrl: 'The tunnel HTTP URL to use',
    tunnelId: 'The tunnel ID to use. The ID will be generated if not specified',
    installPath: 'The path where to install the package',
    useDev: 'If a dev version of the package is found, use it',
    alias: 'The alias to install the package with',
    name: 'The name of the project',
    ifNotExists: 'Do not create if a bot with the same name already exists',
    nameFilter: 'The name filter when listing',
    versionFilter: 'The version filter when listing',
    owned: 'List only owned integrations',
    public: 'List only public integrations',
    limit: 'Limit the number of items returned',
    type: 'The project type',
    template: 'The template to use',
    chatApiUrl: 'The URL of the chat server',
    profileToUse: 'The CLI profile defined in the $BP_BOTPRESS_HOME/profiles.json',
  },

  // === Chat interface ===
  chat: {
    title: 'Botpress Chat',
    exitHint: 'Type "exit" or press ESC key to quit',
    unknown: '<unknown>',
  },

  // === Command messages ===
  messages: {
    aborted: 'Aborted',
    loggedIn: 'Logged In',
    loggingOut: 'Logging out...',

    enterToken: 'Enter your Personal Access Token',
    selectWorkspace: 'Which workspace do you want to login to?',
    loginFailed: 'Login failed. Please check your credentials',
    profileOverwrite: "This command will overwrite the existing profile '{profile}'. Do you want to continue?",
    profileCreate: "This command will create new profile '{profile}'",
    customApiUrl: 'Using custom api url {url} to try fetching workspaces',

    deployConfirmIntegration: 'Are you sure you want to deploy integration {name} v{version}?',
    deployConfirmIntegrationOverride: 'Are you sure you want to override integration {name} v{version}?',
    deployConfirmInterface: 'Are you sure you want to deploy interface {name} v{version}?',
    deployConfirmInterfaceOverride: 'Are you sure you want to override interface {name} v{version}?',
    deployConfirmPlugin: 'Are you sure you want to deploy plugin {name} v{version}?',
    deployConfirmPluginOverride: 'Are you sure you want to override plugin {name} v{version}?',
    deployConfirmBot: 'Are you sure you want to deploy the bot "{name}"?',
    deployConfirmBotCreate: 'Are you sure you want to create a new bot?',
    selectBotDeploy: 'Which bot do you want to deploy?',

    deployingIntegration: 'Deploying integration {name} v{version}...',
    deployingInterface: 'Deploying interface {name} v{version}...',
    deployingPlugin: 'Deploying plugin {name} v{version}...',
    deployingBot: 'Deploying bot {name}...',

    integrationDeployed: 'Integration deployed',
    interfaceDeployed: 'Interface deployed',
    pluginDeployed: 'Plugin deployed',
    botDeployed: 'Bot deployed',

    integrationExists: 'Integration already exists. If you decide to deploy, it will override the existing one.',
    interfaceExists: 'Interface already exists. If you decide to deploy, it will override the existing one.',
    pluginExists: 'Plugin already exists. If you decide to deploy, it will override the existing one.',

    dryRunActive: 'Dry-run mode is active. Simulating {action}...',
    dryRunNotSupported: 'Dry-run mode is not supported for {action}. Skipping deployment...',

    iconMustBeSvg: 'Icon must be an SVG file',
    readmeMustBeMd: 'Readme must be a Markdown file',
    integrationAlreadyDeployedOther: 'Public integration {name} v{version} is already deployed in another workspace.',
    integrationAlreadyPublic:
      'Integration {name} v{version} is already deployed publicly and cannot be updated. Please bump the version.',
    unlistedNotSupported: 'Unlisted visibility is not supported for interfaces. Please use "public" or "private".',
    privateInterfaceWarning:
      'You are currently publishing a private interface, which cannot be used by integrations and plugins. To fix this, change the visibility to "public"',
    cannotSpecifyBothBotIdAndCreateNew: 'Cannot specify both --botId and --createNew',

    building: 'Building project...',
    bundling: 'Bundling project...',
    generating: 'Generating typings...',
    buildComplete: 'Build complete',

    devServerStarting: 'Starting dev server...',
    devServerRunning: 'Dev server running on port {port}',
    watchingChanges: 'Watching for changes...',

    selectProjectType: 'What type of project do you want to create?',
    selectTemplate: 'Which template do you want to use?',
    enterProjectName: 'Enter the project name',
    projectCreated: 'Project created successfully',

    installingPackage: 'Installing package {name}...',
    packageInstalled: 'Package installed successfully',
    removingPackage: 'Removing package {name}...',
    packageRemoved: 'Package removed successfully',

    workspaceHandleConfirm:
      'Your current workspace handle is "{handle}". Do you want to use the name "{handle}/{name}"?',
    workspaceHandleRequired: 'Cannot deploy integration without workspace handle',
    workspaceHandleNotAvailable: 'Handle "{handle}" is not available. Suggestions: {suggestions}',
    workspaceHandleClaimed: 'Handle "{handle}" is now yours!',
    workspaceHandleEnter: 'Please enter a workspace handle',
    workspaceHandleNotYours: 'Handle "{handle}" is not yours and is not available',
    noWorkspaceHandle: "It seems you don't have a workspace handle yet.",
    deployOnAnotherWorkspace: 'Do you want to deploy integration on this workspace instead?',
    cannotDeployWithHandle: 'Cannot deploy integration with handle "{handle}" on workspace "{workspace}"',

    couldNotListWorkspaces: 'Could not list workspaces',
    noWorkspacesFound: 'No workspaces found',
    couldNotListBots: 'Could not fetch existing bots',
    noBotsFound: 'No bots found',
    couldNotCreateBot: 'Could not create bot',
    couldNotUpdateBot: 'Could not update bot "{name}"',
    couldNotGetBot: 'Could not get bot info',
    couldNotFetchWorkspace: 'Could not fetch workspace',
    botCreatedWithId: 'Bot created with ID "{id}" and name "{name}"',

    integrationsFailedToRegister: 'Some integrations failed to register:',

    publicFlagDeprecated: 'The --public flag is deprecated. Please use "--visibility public" instead.',
    publicAndVisibilityBoth: 'The --public flag and --visibility option are both present. Ignoring the --public flag...',
    deprecatedFieldsWarning: "The following fields of the integration's definition are deprecated: {fields}",
  },

  // === Errors ===
  errors: {
    paramRequired: '{param} is required',
    unsupportedProjectType: 'Unsupported project type',
    operationAborted: 'Operation aborted',
  },

  // === Linter rules ===
  linter: {
    integrationTitleRequired: 'The integration MUST have a non-empty title',
    integrationDescriptionRequired: 'The integration MUST have a non-empty description',
    integrationIconRequired: 'The integration MUST have an icon',
    integrationReadmeRequired: 'The integration MUST have a readme file',
    actionsTitleRecommended: 'All actions SHOULD have a title',
    actionsDescriptionRequired: 'All actions MUST have a description',
    actionInputTitleRecommended: 'All action input parameters SHOULD have a title',
    actionInputDescriptionRequired: 'All action input parameters MUST have a description',
    actionOutputTitleRecommended: 'All action output parameters SHOULD have a title',
    actionOutputDescriptionRequired: 'All action output parameters MUST have a description',
    eventsTitleRequired: 'All events MUST have a title',
    eventsDescriptionRequired: 'All events MUST have a description',
    eventOutputTitleRecommended: 'All event output parameters SHOULD have a title',
    eventOutputDescriptionRequired: 'All event output parameters MUST have a description',
    configFieldTitleRequired: 'All configuration fields MUST have a title',
    configFieldDescriptionRequired: 'All configuration fields MUST have a description',
    multipleConfigsTitleRequired: 'Multiple configuration definitions MUST have a title',
    multipleConfigsDescriptionRequired: 'Multiple configuration definitions MUST have a description',
    userTagsTitleRecommended: 'All user tags SHOULD have a title',
    userTagsDescriptionRequired: 'All user tags MUST have a description',
    channelsTitleRecommended: 'All channels SHOULD have a title',
    channelsDescriptionRequired: 'All channels MUST have a description',
    conversationTagsTitleRecommended: 'All conversation tags SHOULD have a title',
    conversationTagsDescriptionRequired: 'All conversation tags MUST have a description',
    messageTagsTitleRecommended: 'All message tags SHOULD have a title',
    messageTagsDescriptionRequired: 'All message tags MUST have a description',
    legacyZuiTitleRemove:
      'Legacy ZUI title fields (ui.title) SHOULD be removed. Please use .title() in your Zod schemas instead',
    legacyZuiExamplesRemove:
      'Legacy ZUI examples fields (ui.examples) SHOULD be removed. There are currently no alternatives',
    stateFieldsTitleRecommended: 'All state fields SHOULD have a title',
    stateFieldsDescriptionRequired: 'All state fields MUST have a description',
    secretsDescriptionRequired: 'All secrets MUST have a description',
    considerMigratingToConfigurations:
      'Consider migrating to the new multiple configuration format: you MAY move your configuration from "configuration" to "configurations"',

    interfaceTitleRequired: 'The interface MUST have a non-empty title',
    interfaceDescriptionRequired: 'The interface MUST have a non-empty description',

    botTitleRequired: 'The bot MUST have a non-empty title',
    botDescriptionRequired: 'The bot MUST have a non-empty description',

    mustHaveTitle: 'MUST have a non-empty title',
    mustHaveDescription: 'MUST have a non-empty description',
    shouldHaveTitle: 'SHOULD have a non-empty title',
    shouldHaveDescription: 'SHOULD have a non-empty description',
    useTitleMethod: 'MUST provide a non-empty title by using .title() in its Zod schema',
    useDescribeMethod: 'MUST provide a non-empty description by using .describe() in its Zod schema',
  },
}
