import type { LocaleStrings } from './types'

export const ru: LocaleStrings = {
  // === Описания команд ===
  commands: {
    login: 'Войти в Botpress Cloud',
    logout: 'Выйти из Botpress Cloud',
    bots: {
      description: 'Команды для работы с ботами',
      create: 'Создать нового бота',
      get: 'Получить информацию о боте',
      delete: 'Удалить бота',
      list: 'Показать список ботов',
    },
    integrations: {
      description: 'Команды для работы с интеграциями',
      get: 'Получить информацию об интеграции',
      delete: 'Удалить интеграцию',
      list: 'Показать список интеграций',
    },
    interfaces: {
      description: 'Команды для работы с интерфейсами',
      get: 'Получить информацию об интерфейсе',
      delete: 'Удалить интерфейс',
      list: 'Показать список интерфейсов',
    },
    plugins: {
      description: 'Команды для работы с плагинами',
      get: 'Получить информацию о плагине',
      delete: 'Удалить плагин',
      list: 'Показать список плагинов',
    },
    init: 'Создать новый проект',
    generate: 'Сгенерировать типы для автодополнения',
    bundle: 'Собрать проект Botpress в бандл',
    build: 'Сгенерировать типы и собрать проект',
    read: 'Прочитать и распарсить описание интеграции',
    serve: 'Запустить проект локально',
    deploy: 'Опубликовать проект в облако',
    add: 'Установить пакет (интеграцию или интерфейс)',
    remove: 'Удалить пакет из зависимостей проекта',
    dev: 'Запустить проект в режиме разработки',
    lint: 'ЭКСПЕРИМЕНТАЛЬНО: Проверить описание интеграции',
    chat: 'ЭКСПЕРИМЕНТАЛЬНО: Общаться с ботом через CLI',
    profiles: {
      description: 'Команды для работы с профилями CLI',
      list: 'Показать все доступные профили',
      active: 'Показать текущий активный профиль',
      use: 'Переключиться на другой профиль',
    },
  },

  // === Описания опций ===
  options: {
    port: 'Порт для запуска сервера',
    workDir: 'Путь к папке проекта',
    noBuild: 'Пропустить этап сборки',
    dryRun: 'Тестовый запуск без реальных изменений',
    apiUrl: 'URL сервера Botpress',
    token: 'Ваш персональный токен доступа (Personal Access Token)',
    workspaceId: 'ID рабочего пространства для публикации',
    secrets: 'Значения секретов интеграции',
    botRef: 'ID бота. Имя бота не поддерживается.',
    packageRef:
      'ID или имя пакета с опциональной версией. Может быть интеграцией или интерфейсом. Пример: teams, teams@0.2.0, llm@5.1.0',
    integrationRef: 'ID или имя интеграции с опциональной версией. Пример: teams или teams@0.2.0',
    interfaceRef: 'ID или имя интерфейса с версией. Пример: llm@5.1.0',
    pluginRef: 'ID или имя плагина с версией. Пример: knowledge@0.0.1',
    sourceMap: 'Генерировать карты исходного кода (sourcemaps)',
    minify: 'Минифицировать собранный код',
    dev: 'Показывать только dev-версии ботов/интеграций',
    verbose: 'Включить подробное логирование',
    confirm: 'Автоматически подтверждать все запросы',
    json: 'Выводить только JSON. Удобно для передачи данных другим инструментам',
    botpressHome: 'Путь к домашней директории Botpress',
    profile: 'Профиль CLI из файла $BP_BOTPRESS_HOME/profiles.json',
    botId: 'ID бота для публикации. Используется только при публикации бота',
    createNewBot: 'Создать нового бота при публикации. Используется только при публикации бота',
    visibility:
      'Видимость проекта. По умолчанию проекты приватные. Режим "unlisted" поддерживается только для интеграций и плагинов.',
    publicDeprecated: 'УСТАРЕЛО: Используйте "--visibility public".',
    allowDeprecated: 'Разрешить устаревшие функции в проекте',
    tunnelUrl: 'HTTP URL туннеля',
    tunnelId: 'ID туннеля. Если не указан, будет сгенерирован автоматически',
    installPath: 'Путь для установки пакета',
    useDev: 'Использовать dev-версию пакета, если доступна',
    alias: 'Псевдоним для установки пакета',
    name: 'Название проекта',
    ifNotExists: 'Не создавать, если бот с таким именем уже существует',
    nameFilter: 'Фильтр по имени',
    versionFilter: 'Фильтр по версии',
    owned: 'Показывать только собственные интеграции',
    public: 'Показывать только публичные интеграции',
    limit: 'Ограничить количество возвращаемых записей',
    type: 'Тип проекта',
    template: 'Шаблон для создания',
    chatApiUrl: 'URL сервера чата',
    profileToUse: 'Профиль CLI из файла $BP_BOTPRESS_HOME/profiles.json',
  },

  // === Интерфейс чата ===
  chat: {
    title: 'Чат Botpress',
    exitHint: 'Введите "exit" или нажмите ESC для выхода',
    unknown: '<неизвестно>',
  },

  // === Сообщения команд ===
  messages: {
    aborted: 'Операция отменена',
    loggedIn: 'Вход выполнен успешно',
    loggingOut: 'Выход из системы...',

    enterToken: 'Введите ваш персональный токен доступа (Personal Access Token)',
    selectWorkspace: 'Выберите рабочее пространство для входа:',
    loginFailed: 'Не удалось войти. Проверьте учётные данные',
    profileOverwrite: 'Профиль "{profile}" будет перезаписан. Продолжить?',
    profileCreate: 'Будет создан новый профиль "{profile}"',
    customApiUrl: 'Используется нестандартный API URL: {url}',

    deployConfirmIntegration: 'Опубликовать интеграцию {name} версии {version}?',
    deployConfirmIntegrationOverride: 'Перезаписать интеграцию {name} версии {version}?',
    deployConfirmInterface: 'Опубликовать интерфейс {name} версии {version}?',
    deployConfirmInterfaceOverride: 'Перезаписать интерфейс {name} версии {version}?',
    deployConfirmPlugin: 'Опубликовать плагин {name} версии {version}?',
    deployConfirmPluginOverride: 'Перезаписать плагин {name} версии {version}?',
    deployConfirmBot: 'Опубликовать бота "{name}"?',
    deployConfirmBotCreate: 'Создать нового бота?',
    selectBotDeploy: 'Выберите бота для публикации:',

    deployingIntegration: 'Публикация интеграции {name} версии {version}...',
    deployingInterface: 'Публикация интерфейса {name} версии {version}...',
    deployingPlugin: 'Публикация плагина {name} версии {version}...',
    deployingBot: 'Публикация бота {name}...',

    integrationDeployed: 'Интеграция опубликована',
    interfaceDeployed: 'Интерфейс опубликован',
    pluginDeployed: 'Плагин опубликован',
    botDeployed: 'Бот опубликован',

    integrationExists: 'Интеграция уже существует. При публикации она будет перезаписана.',
    interfaceExists: 'Интерфейс уже существует. При публикации он будет перезаписан.',
    pluginExists: 'Плагин уже существует. При публикации он будет перезаписан.',

    dryRunActive: 'Тестовый режим. Симуляция: {action}...',
    dryRunNotSupported: 'Тестовый режим не поддерживается для {action}. Публикация пропущена...',

    iconMustBeSvg: 'Иконка должна быть в формате SVG',
    readmeMustBeMd: 'README должен быть в формате Markdown (.md)',
    integrationAlreadyDeployedOther:
      'Публичная интеграция {name} версии {version} уже опубликована в другом рабочем пространстве.',
    integrationAlreadyPublic:
      'Интеграция {name} версии {version} уже опубликована публично и не может быть обновлена. Увеличьте номер версии.',
    unlistedNotSupported:
      'Режим "unlisted" не поддерживается для интерфейсов. Используйте "public" или "private".',
    privateInterfaceWarning:
      'Вы публикуете приватный интерфейс, который не смогут использовать интеграции и плагины. Измените видимость на "public", чтобы исправить это.',
    cannotSpecifyBothBotIdAndCreateNew: 'Нельзя указать одновременно --botId и --createNew',

    building: 'Сборка проекта...',
    bundling: 'Создание бандла...',
    generating: 'Генерация типов...',
    buildComplete: 'Сборка завершена',

    devServerStarting: 'Запуск сервера разработки...',
    devServerRunning: 'Сервер разработки запущен на порту {port}',
    watchingChanges: 'Отслеживание изменений...',

    selectProjectType: 'Выберите тип проекта:',
    selectTemplate: 'Выберите шаблон:',
    enterProjectName: 'Введите название проекта',
    projectCreated: 'Проект успешно создан',

    installingPackage: 'Установка пакета {name}...',
    packageInstalled: 'Пакет успешно установлен',
    removingPackage: 'Удаление пакета {name}...',
    packageRemoved: 'Пакет успешно удалён',

    workspaceHandleConfirm:
      'Ваш текущий идентификатор рабочего пространства: "{handle}". Использовать имя "{handle}/{name}"?',
    workspaceHandleRequired: 'Невозможно опубликовать интеграцию без идентификатора рабочего пространства',
    workspaceHandleNotAvailable: 'Идентификатор "{handle}" недоступен. Варианты: {suggestions}',
    workspaceHandleClaimed: 'Идентификатор "{handle}" теперь ваш!',
    workspaceHandleEnter: 'Введите идентификатор рабочего пространства',
    workspaceHandleNotYours: 'Идентификатор "{handle}" занят и вам не принадлежит',
    noWorkspaceHandle: 'У вас ещё нет идентификатора рабочего пространства.',
    deployOnAnotherWorkspace: 'Опубликовать интеграцию в этом рабочем пространстве?',
    cannotDeployWithHandle:
      'Невозможно опубликовать интеграцию с идентификатором "{handle}" в рабочем пространстве "{workspace}"',

    couldNotListWorkspaces: 'Не удалось получить список рабочих пространств',
    noWorkspacesFound: 'Рабочие пространства не найдены',
    couldNotListBots: 'Не удалось получить список ботов',
    noBotsFound: 'Боты не найдены',
    couldNotCreateBot: 'Не удалось создать бота',
    couldNotUpdateBot: 'Не удалось обновить бота "{name}"',
    couldNotGetBot: 'Не удалось получить информацию о боте',
    couldNotFetchWorkspace: 'Не удалось получить информацию о рабочем пространстве',
    botCreatedWithId: 'Создан бот с ID "{id}" и именем "{name}"',

    integrationsFailedToRegister: 'Не удалось зарегистрировать некоторые интеграции:',

    publicFlagDeprecated: 'Флаг --public устарел. Используйте "--visibility public".',
    publicAndVisibilityBoth: 'Указаны оба флага --public и --visibility. Флаг --public будет проигнорирован...',
    deprecatedFieldsWarning: 'Следующие поля в описании интеграции устарели: {fields}',
  },

  // === Ошибки ===
  errors: {
    paramRequired: 'Параметр "{param}" обязателен',
    unsupportedProjectType: 'Неподдерживаемый тип проекта',
    operationAborted: 'Операция отменена',
  },

  // === Правила линтера ===
  linter: {
    integrationTitleRequired: 'Интеграция ДОЛЖНА иметь непустой заголовок (title)',
    integrationDescriptionRequired: 'Интеграция ДОЛЖНА иметь непустое описание (description)',
    integrationIconRequired: 'Интеграция ДОЛЖНА иметь иконку',
    integrationReadmeRequired: 'Интеграция ДОЛЖНА иметь файл readme',
    actionsTitleRecommended: 'Все действия (actions) РЕКОМЕНДУЕТСЯ снабжать заголовком',
    actionsDescriptionRequired: 'Все действия (actions) ДОЛЖНЫ иметь описание',
    actionInputTitleRecommended: 'Все входные параметры действий РЕКОМЕНДУЕТСЯ снабжать заголовком',
    actionInputDescriptionRequired: 'Все входные параметры действий ДОЛЖНЫ иметь описание',
    actionOutputTitleRecommended: 'Все выходные параметры действий РЕКОМЕНДУЕТСЯ снабжать заголовком',
    actionOutputDescriptionRequired: 'Все выходные параметры действий ДОЛЖНЫ иметь описание',
    eventsTitleRequired: 'Все события (events) ДОЛЖНЫ иметь заголовок',
    eventsDescriptionRequired: 'Все события (events) ДОЛЖНЫ иметь описание',
    eventOutputTitleRecommended: 'Все выходные параметры событий РЕКОМЕНДУЕТСЯ снабжать заголовком',
    eventOutputDescriptionRequired: 'Все выходные параметры событий ДОЛЖНЫ иметь описание',
    configFieldTitleRequired: 'Все поля конфигурации ДОЛЖНЫ иметь заголовок',
    configFieldDescriptionRequired: 'Все поля конфигурации ДОЛЖНЫ иметь описание',
    multipleConfigsTitleRequired: 'Множественные конфигурации ДОЛЖНЫ иметь заголовок',
    multipleConfigsDescriptionRequired: 'Множественные конфигурации ДОЛЖНЫ иметь описание',
    userTagsTitleRecommended: 'Все теги пользователей РЕКОМЕНДУЕТСЯ снабжать заголовком',
    userTagsDescriptionRequired: 'Все теги пользователей ДОЛЖНЫ иметь описание',
    channelsTitleRecommended: 'Все каналы (channels) РЕКОМЕНДУЕТСЯ снабжать заголовком',
    channelsDescriptionRequired: 'Все каналы (channels) ДОЛЖНЫ иметь описание',
    conversationTagsTitleRecommended: 'Все теги диалогов РЕКОМЕНДУЕТСЯ снабжать заголовком',
    conversationTagsDescriptionRequired: 'Все теги диалогов ДОЛЖНЫ иметь описание',
    messageTagsTitleRecommended: 'Все теги сообщений РЕКОМЕНДУЕТСЯ снабжать заголовком',
    messageTagsDescriptionRequired: 'Все теги сообщений ДОЛЖНЫ иметь описание',
    legacyZuiTitleRemove:
      'Устаревшие поля заголовков ZUI (ui.title) СЛЕДУЕТ удалить. Используйте метод .title() в схемах Zod',
    legacyZuiExamplesRemove:
      'Устаревшие поля примеров ZUI (ui.examples) СЛЕДУЕТ удалить. Альтернативы пока нет',
    stateFieldsTitleRecommended: 'Все поля состояния РЕКОМЕНДУЕТСЯ снабжать заголовком',
    stateFieldsDescriptionRequired: 'Все поля состояния ДОЛЖНЫ иметь описание',
    secretsDescriptionRequired: 'Все секреты ДОЛЖНЫ иметь описание',
    considerMigratingToConfigurations:
      'Рекомендуется перейти на новый формат множественных конфигураций: переместите конфигурацию из "configuration" в "configurations"',

    interfaceTitleRequired: 'Интерфейс ДОЛЖЕН иметь непустой заголовок',
    interfaceDescriptionRequired: 'Интерфейс ДОЛЖЕН иметь непустое описание',

    botTitleRequired: 'Бот ДОЛЖЕН иметь непустой заголовок',
    botDescriptionRequired: 'Бот ДОЛЖЕН иметь непустое описание',

    mustHaveTitle: 'ДОЛЖЕН иметь непустой заголовок',
    mustHaveDescription: 'ДОЛЖЕН иметь непустое описание',
    shouldHaveTitle: 'РЕКОМЕНДУЕТСЯ указать заголовок',
    shouldHaveDescription: 'РЕКОМЕНДУЕТСЯ указать описание',
    useTitleMethod: 'ДОЛЖЕН указать заголовок с помощью метода .title() в схеме Zod',
    useDescribeMethod: 'ДОЛЖЕН указать описание с помощью метода .describe() в схеме Zod',
  },
}
