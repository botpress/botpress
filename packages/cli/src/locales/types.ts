/**
 * Система локализации для Botpress CLI
 * Определения типов для строк интерфейса
 */

export type LocaleStrings = {
  // === Описания команд (command-definitions) ===
  commands: {
    login: string
    logout: string
    bots: {
      description: string
      create: string
      get: string
      delete: string
      list: string
    }
    integrations: {
      description: string
      get: string
      delete: string
      list: string
    }
    interfaces: {
      description: string
      get: string
      delete: string
      list: string
    }
    plugins: {
      description: string
      get: string
      delete: string
      list: string
    }
    init: string
    generate: string
    bundle: string
    build: string
    read: string
    serve: string
    deploy: string
    add: string
    remove: string
    dev: string
    lint: string
    chat: string
    profiles: {
      description: string
      list: string
      active: string
      use: string
    }
  }

  // === Описания опций (config) ===
  options: {
    port: string
    workDir: string
    noBuild: string
    dryRun: string
    apiUrl: string
    token: string
    workspaceId: string
    secrets: string
    botRef: string
    packageRef: string
    integrationRef: string
    interfaceRef: string
    pluginRef: string
    sourceMap: string
    minify: string
    dev: string
    verbose: string
    confirm: string
    json: string
    botpressHome: string
    profile: string
    botId: string
    createNewBot: string
    visibility: string
    publicDeprecated: string
    allowDeprecated: string
    tunnelUrl: string
    tunnelId: string
    installPath: string
    useDev: string
    alias: string
    name: string
    ifNotExists: string
    nameFilter: string
    versionFilter: string
    owned: string
    public: string
    limit: string
    type: string
    template: string
    chatApiUrl: string
    profileToUse: string
  }

  // === Интерфейс чата ===
  chat: {
    title: string
    exitHint: string
    unknown: string
  }

  // === Сообщения команд ===
  messages: {
    // Общие
    aborted: string
    loggedIn: string
    loggingOut: string

    // Login
    enterToken: string
    selectWorkspace: string
    loginFailed: string
    profileOverwrite: string
    profileCreate: string
    customApiUrl: string

    // Deploy
    deployConfirmIntegration: string
    deployConfirmIntegrationOverride: string
    deployConfirmInterface: string
    deployConfirmInterfaceOverride: string
    deployConfirmPlugin: string
    deployConfirmPluginOverride: string
    deployConfirmBot: string
    deployConfirmBotCreate: string
    selectBotDeploy: string

    deployingIntegration: string
    deployingInterface: string
    deployingPlugin: string
    deployingBot: string

    integrationDeployed: string
    interfaceDeployed: string
    pluginDeployed: string
    botDeployed: string

    integrationExists: string
    interfaceExists: string
    pluginExists: string

    dryRunActive: string
    dryRunNotSupported: string

    // Errors
    iconMustBeSvg: string
    readmeMustBeMd: string
    integrationAlreadyDeployedOther: string
    integrationAlreadyPublic: string
    unlistedNotSupported: string
    privateInterfaceWarning: string
    cannotSpecifyBothBotIdAndCreateNew: string

    // Build
    building: string
    bundling: string
    generating: string
    buildComplete: string

    // Dev
    devServerStarting: string
    devServerRunning: string
    watchingChanges: string

    // Init
    selectProjectType: string
    selectTemplate: string
    enterProjectName: string
    projectCreated: string

    // Add/Remove
    installingPackage: string
    packageInstalled: string
    removingPackage: string
    packageRemoved: string

    // Workspace handle
    workspaceHandleConfirm: string
    workspaceHandleRequired: string
    workspaceHandleNotAvailable: string
    workspaceHandleClaimed: string
    workspaceHandleEnter: string
    workspaceHandleNotYours: string
    noWorkspaceHandle: string
    deployOnAnotherWorkspace: string
    cannotDeployWithHandle: string

    // Errors
    couldNotListWorkspaces: string
    noWorkspacesFound: string
    couldNotListBots: string
    noBotsFound: string
    couldNotCreateBot: string
    couldNotUpdateBot: string
    couldNotGetBot: string
    couldNotFetchWorkspace: string
    botCreatedWithId: string

    // Integrations failed
    integrationsFailedToRegister: string

    // Deprecated
    publicFlagDeprecated: string
    publicAndVisibilityBoth: string
    deprecatedFieldsWarning: string
  }

  // === Ошибки ===
  errors: {
    paramRequired: string
    unsupportedProjectType: string
    operationAborted: string
  }

  // === Правила линтера ===
  linter: {
    // Integration rules
    integrationTitleRequired: string
    integrationDescriptionRequired: string
    integrationIconRequired: string
    integrationReadmeRequired: string
    actionsTitleRecommended: string
    actionsDescriptionRequired: string
    actionInputTitleRecommended: string
    actionInputDescriptionRequired: string
    actionOutputTitleRecommended: string
    actionOutputDescriptionRequired: string
    eventsTitleRequired: string
    eventsDescriptionRequired: string
    eventOutputTitleRecommended: string
    eventOutputDescriptionRequired: string
    configFieldTitleRequired: string
    configFieldDescriptionRequired: string
    multipleConfigsTitleRequired: string
    multipleConfigsDescriptionRequired: string
    userTagsTitleRecommended: string
    userTagsDescriptionRequired: string
    channelsTitleRecommended: string
    channelsDescriptionRequired: string
    conversationTagsTitleRecommended: string
    conversationTagsDescriptionRequired: string
    messageTagsTitleRecommended: string
    messageTagsDescriptionRequired: string
    legacyZuiTitleRemove: string
    legacyZuiExamplesRemove: string
    stateFieldsTitleRecommended: string
    stateFieldsDescriptionRequired: string
    secretsDescriptionRequired: string
    considerMigratingToConfigurations: string

    // Interface rules
    interfaceTitleRequired: string
    interfaceDescriptionRequired: string

    // Bot rules
    botTitleRequired: string
    botDescriptionRequired: string

    // Generic
    mustHaveTitle: string
    mustHaveDescription: string
    shouldHaveTitle: string
    shouldHaveDescription: string
    useTitleMethod: string
    useDescribeMethod: string
  }
}
