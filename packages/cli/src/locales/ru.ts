/**
 * Русская локализация Botpress CLI
 * Russian localization for Botpress CLI
 */

export const ru = {
  // ===== КОМАНДЫ (command-definitions.ts) =====
  commands: {
    login: {
      description: 'Войти в Botpress Cloud',
    },
    logout: {
      description: 'Выйти из Botpress Cloud',
    },
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
    init: 'Инициализировать новый проект',
    generate: 'Сгенерировать типы для автодополнения',
    bundle: 'Собрать проект Botpress',
    build: 'Сгенерировать типы и собрать проект Botpress',
    read: 'Прочитать и проанализировать определение интеграции',
    serve: 'Запустить проект локально',
    deploy: 'Развернуть проект в облаке',
    add: 'Установить пакет (интеграцию или интерфейс)',
    remove: 'Удалить пакет из зависимостей проекта',
    dev: 'Запустить проект в режиме разработки',
    lint: 'ЭКСПЕРИМЕНТАЛЬНО: Проверить определение интеграции',
    chat: 'ЭКСПЕРИМЕНТАЛЬНО: Общаться с ботом напрямую из CLI',
    profiles: {
      description: 'Команды для работы с профилями CLI',
      list: 'Показать список всех профилей',
      active: 'Показать текущий активный профиль',
      use: 'Выбрать профиль',
    },
  },

  // ===== ОПЦИИ КОМАНД (config.ts) =====
  options: {
    port: 'Порт для использования',
    workDir: 'Путь к проекту',
    noBuild: 'Пропустить этап сборки',
    dryRun: 'Попросить API не выполнять реальную операцию (тестовый режим)',
    apiUrl: 'URL сервера Botpress',
    token: 'Ваш персональный токен доступа',
    workspaceId: 'ID рабочего пространства для развёртывания',
    secrets: 'Значения секретов интеграции',
    botRef: 'ID бота. Имя бота не поддерживается.',
    packageRef:
      'ID или имя пакета с необязательной версией. Пакет может быть интеграцией или интерфейсом. Например: teams, teams@0.2.0, llm@5.1.0',
    integrationRef: 'ID или имя интеграции с необязательной версией. Например: teams или teams@0.2.0',
    interfaceRef: 'ID или имя интерфейса с версией. Например: llm@5.1.0',
    pluginRef: 'ID или имя плагина с версией. Например: knowledge@0.0.1',
    sourceMap: 'Генерировать карты исходного кода',
    minify: 'Минифицировать собранный код',
    dev: 'Показать только dev-ботов / dev-интеграции',
    verbose: 'Включить подробное логирование',
    confirm: 'Подтвердить все запросы автоматически',
    json: 'Выводить только чистый JSON в stdout. Полезно для передачи данных другим инструментам',
    botpressHome: 'Путь к домашней директории Botpress',
    profile: 'Профиль CLI, определённый в $BP_BOTPRESS_HOME/profiles.json',
    botId: 'ID бота для развёртывания. Используется только при развёртывании бота',
    createNewBot: 'Создать нового бота при развёртывании. Используется только при развёртывании бота',
    visibility:
      'Видимость проекта. По умолчанию проекты всегда приватные. Режим "unlisted" поддерживается только для интеграций и плагинов.',
    publicDeprecated: 'УСТАРЕЛО: Используйте "--visibility public" вместо этого.',
    allowDeprecated: 'Разрешить устаревшие функции в проекте',
    tunnelUrl: 'HTTP URL туннеля для использования',
    tunnelId: 'ID туннеля для использования. Если не указан, будет сгенерирован автоматически',
    installPath: 'Путь для установки пакета',
    useDev: 'Использовать dev-версию пакета, если она доступна',
    alias: 'Псевдоним для установки пакета',
    aliasRemove: 'Псевдоним пакета для удаления',
    name: 'Имя проекта',
    template: 'Шаблон для использования',
    type: 'Тип проекта',
    chatApiUrl: 'URL сервера чата',
    botIdChat: 'ID бота для общения',
    profileToUse: 'Профиль CLI, определённый в $BP_BOTPRESS_HOME/profiles.json',
    nameFilter: 'Фильтр по имени при выводе списка',
    versionFilter: 'Фильтр по версии при выводе списка',
    owned: 'Показать только свои интеграции',
    public: 'Показать только публичные интеграции',
    limit: 'Ограничить количество возвращаемых результатов',
    ifNotExists: 'Не создавать, если бот с таким именем уже существует',
  },

  // ===== СООБЩЕНИЯ ОБ ОШИБКАХ (errors.ts) =====
  errors: {
    exclusiveBotFeature: 'Эта функция доступна только для ботов. Этот проект является интеграцией или интерфейсом.',
    exclusiveIntegrationFeature:
      'Эта функция доступна только для интеграций. Этот проект является ботом или интерфейсом.',
    connectionRefused: 'Сервер отклонил подключение',
    unknownApiError: 'Произошла неизвестная ошибка API',
    noBundleFound: 'Сборка не найдена. Сначала выполните `bp bundle`.',
    noBotsFound: (url: string) =>
      `Бот не найден в вашем рабочем пространстве. Сначала создайте бота на ${url}.`,
    noWorkspacesFound: 'Рабочее пространство не найдено. Сначала создайте его.',
    notLoggedIn: 'Вы не авторизованы. Сначала выполните `bp login`.',
    paramRequired: (param: string) => `${param} обязателен.`,
    invalidPackageRef: (ref: string) => `Неверная ссылка на пакет "${ref}".`,
    unsupportedProjectType: 'Неподдерживаемый тип проекта.',
    projectNotFound: (workdir: string) => `Определение проекта не найдено в "${workdir}".`,
    aborted: 'Операция отменена',
  },

  // ===== СООБЩЕНИЯ КОМАНДЫ DEPLOY =====
  deploy: {
    iconMustBeSvg: 'Иконка должна быть в формате SVG',
    readmeMustBeMd: 'Файл readme должен быть в формате Markdown',
    integrationAlreadyPublic: (name: string, version: string) =>
      `Интеграция ${name} v${version} уже развёрнута публично и не может быть обновлена. Пожалуйста, опубликуйте новую версию.`,
    integrationInAnotherWorkspace: (name: string, version: string) =>
      `Публичная интеграция ${name} v${version} уже развёрнута в другом рабочем пространстве.`,
    integrationExists: 'Интеграция уже существует. При развёртывании она будет перезаписана.',
    confirmOverrideIntegration: (name: string, version: string) =>
      `Вы уверены, что хотите перезаписать интеграцию ${name} v${version}?`,
    confirmDeployIntegration: (name: string, version: string) =>
      `Вы уверены, что хотите развернуть интеграцию ${name} v${version}?`,
    preparingIntegration: 'Подготовка тела запроса интеграции...',
    deployingIntegration: (name: string, version: string) => `Развёртывание интеграции ${name} v${version}...`,
    integrationDeployed: 'Интеграция развёрнута',
    dryRunSimulating: 'Активен тестовый режим. Симуляция операции...',
    couldNotUpdateIntegration: (name: string) => `Не удалось обновить интеграцию "${name}"`,
    couldNotCreateIntegration: (name: string) => `Не удалось создать интеграцию "${name}"`,
    lookingForPreviousVersion: (name: string) => `Поиск предыдущей версии интеграции "${name}"`,
    previousVersionFound: (version: string) => `Найдена предыдущая версия: ${version}`,
    noPreviousVersionFound: 'Предыдущая версия не найдена',

    // Interface
    unlistedNotSupported: 'Режим "unlisted" не поддерживается для интерфейсов. Используйте "public" или "private".',
    interfaceExists: 'Интерфейс уже существует. При развёртывании он будет перезаписан.',
    confirmOverrideInterface: (name: string, version: string) =>
      `Вы уверены, что хотите перезаписать интерфейс ${name} v${version}?`,
    confirmDeployInterface: (name: string, version: string) =>
      `Вы уверены, что хотите развернуть интерфейс ${name} v${version}?`,
    privateInterfaceWarning:
      'Вы публикуете приватный интерфейс, который не может использоваться интеграциями и плагинами. Измените видимость на "public".',
    deployingInterface: (name: string, version: string) => `Развёртывание интерфейса ${name} v${version}...`,
    interfaceDeployed: 'Интерфейс развёрнут',
    dryRunNotSupportedInterfaceUpdate: 'Тестовый режим не поддерживается для обновления интерфейсов. Пропуск...',
    dryRunNotSupportedInterfaceCreate: 'Тестовый режим не поддерживается для создания интерфейсов. Пропуск...',
    couldNotUpdateInterface: (name: string) => `Не удалось обновить интерфейс "${name}"`,
    couldNotCreateInterface: (name: string) => `Не удалось создать интерфейс "${name}"`,

    // Plugin
    pluginExists: 'Плагин уже существует. При развёртывании он будет перезаписан.',
    confirmOverridePlugin: (name: string, version: string) =>
      `Вы уверены, что хотите перезаписать плагин ${name} v${version}?`,
    confirmDeployPlugin: (name: string, version: string) =>
      `Вы уверены, что хотите развернуть плагин ${name} v${version}?`,
    preparingPlugin: 'Подготовка тела запроса плагина...',
    deployingPlugin: (name: string, version: string) => `Развёртывание плагина ${name} v${version}...`,
    pluginDeployed: 'Плагин развёрнут',
    dryRunNotSupportedPluginUpdate: 'Тестовый режим не поддерживается для обновления плагинов. Пропуск...',
    dryRunNotSupportedPluginCreate: 'Тестовый режим не поддерживается для создания плагинов. Пропуск...',
    couldNotUpdatePlugin: (name: string) => `Не удалось обновить плагин "${name}"`,
    couldNotCreatePlugin: (name: string) => `Не удалось создать плагин "${name}"`,

    // Bot
    dryRunNotSupportedBot: 'Тестовый режим не поддерживается для развёртывания ботов. Пропуск...',
    cannotSpecifyBothBotIdAndCreateNew: 'Нельзя указать одновременно --botId и --createNew',
    confirmCreateNewBot: 'Вы уверены, что хотите создать нового бота?',
    confirmDeployBot: (name: string) => `Вы уверены, что хотите развернуть бота "${name}"?`,
    deployingBot: (name: string) => `Развёртывание бота ${name}...`,
    botDeployed: 'Бот развёрнут',
    couldNotUpdateBot: (name: string) => `Не удалось обновить бота "${name}"`,
    couldNotCreateBot: 'Не удалось создать бота',
    botCreatedWithId: (id: string, name: string) => `Бот создан с ID "${id}" и именем "${name}"`,
    couldNotFetchBots: 'Не удалось получить список ботов',
    whichBotToDeploy: 'Какого бота вы хотите развернуть?',
    couldNotGetBotInfo: 'Не удалось получить информацию о боте',
    someIntegrationsFailed: 'Некоторые интеграции не удалось зарегистрировать:',

    // Workspace handle
    couldNotFetchWorkspace: 'Не удалось получить информацию о рабочем пространстве',
    handleNotAssociated: (handle: string) =>
      `Хэндл интеграции "${handle}" не связан ни с одним из ваших рабочих пространств.`,
    loggedInToDifferentWorkspace: (current: string, handle: string, target: string) =>
      `Вы авторизованы в рабочем пространстве "${current}", но хэндл "${handle}" принадлежит "${target}".`,
    confirmUseAlternateWorkspace: 'Хотите развернуть интеграцию в этом рабочем пространстве?',
    cannotDeployWithHandle: (handle: string, workspace: string) =>
      `Невозможно развернуть интеграцию с хэндлом "${handle}" в рабочем пространстве "${workspace}"`,
    cannotDeployWithoutHandle: 'Невозможно развернуть интеграцию без хэндла рабочего пространства',
    confirmUseHandleName: (handle: string, name: string) =>
      `Хэндл вашего рабочего пространства: "${handle}". Использовать имя "${handle}/${name}"?`,
    couldNotCheckHandle: 'Не удалось проверить доступность хэндла',
    handleNotAvailable: (handle: string) => `Хэндл "${handle}" вам не принадлежит и недоступен`,
    confirmClaimHandle: (handle: string, workspace: string) =>
      `Хэндл "${handle}" доступен. Хотите закрепить его за рабочим пространством ${workspace}?`,
    couldNotClaimHandle: (handle: string) => `Не удалось закрепить хэндл "${handle}"`,
    handleIsYours: (handle: string) => `Хэндл "${handle}" теперь ваш!`,
    noWorkspaceHandle: 'Похоже, у вас ещё нет хэндла рабочего пространства.',
    enterWorkspaceHandle: 'Введите хэндл рабочего пространства',
    handleNotAvailableSuggestions: (handle: string, suggestions: string) =>
      `Хэндл "${handle}" недоступен. Предложения: ${suggestions}`,
    couldNotListWorkspaces: 'Не удалось получить список рабочих пространств',
    invalidIntegrationName: (name: string) =>
      `Неверное имя интеграции "${name}": допускается только один слэш`,

    // Deprecated features
    deprecatedFieldsWarning: (fields: string) =>
      `Следующие поля определения интеграции устарели: ${fields}`,
    publicFlagDeprecated: 'Флаг --public устарел. Используйте "--visibility public" вместо этого.',
    publicAndVisibilityBothPresent: 'Указаны и флаг --public, и опция --visibility. Флаг --public будет проигнорирован...',
  },

  // ===== ОБЩИЕ СООБЩЕНИЯ =====
  common: {
    aborted: 'Отменено',
    yes: 'Да',
    no: 'Нет',
    submit: 'Отправить',
    cancel: 'Отмена',
    continue: 'Продолжить',
    close: 'Закрыть',
    loading: 'Загрузка...',
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
    noDataAvailable: 'Данные недоступны',
    noCommandProvided:
      'Вы не указали команду. Используйте флаг --help для просмотра списка доступных команд.',
  },

  // ===== СООБЩЕНИЯ INIT =====
  init: {
    projectTypeQuestion: 'Какой тип проекта вы хотите инициализировать?',
    projectNameQuestion: (type: string) => `Как назвать ваш ${type}?`,
    templateQuestion: 'Какой шаблон использовать?',
    directoryExists: (dir: string) => `Директория ${dir} уже существует. Хотите перезаписать её?`,
    unknownProjectType: (type: string) => `Неизвестный тип проекта: ${type}`,
    noTemplateFound: (type: string, template: string) => `Шаблон "${template}" для типа ${type} не найден`,
    usingDefaultTemplate: (template: string) => `Используется шаблон по умолчанию: ${template}`,
    botInitialized: (path: string) => `Проект бота инициализирован в ${path}`,
    integrationInitialized: (path: string) => `Проект интеграции инициализирован в ${path}`,
    pluginInitialized: (path: string) => `Проект плагина инициализирован в ${path}`,
    failedToReadPackageJson: 'Не удалось прочитать файл package.json',
    failedToWritePackageJson: 'Не удалось записать файл package.json',
    enterWorkspaceHandle: 'Введите хэндл рабочего пространства',
    whichWorkspaceToUse: 'Какое рабочее пространство использовать?',
    unableToListWorkspaces: 'Не удалось получить список рабочих пространств',
    couldNotAuthenticate: 'Не удалось выполнить аутентификацию',
    workspaceHandleRequired: 'Требуется хэндл рабочего пространства',
  },

  // ===== СООБЩЕНИЯ LOGIN =====
  login: {
    alreadyLoggedIn: 'Вы уже авторизованы',
    loggingIn: 'Вход в систему...',
    loginSuccess: 'Авторизация успешна',
    loginFailed: 'Не удалось войти в систему',
    openingBrowser: 'Открытие браузера для авторизации...',
    waitingForAuth: 'Ожидание завершения авторизации...',
    tokenReceived: 'Токен получен',
    selectWorkspace: 'Выберите рабочее пространство',
    noWorkspacesAvailable: 'Нет доступных рабочих пространств',
    overwriteProfile: (profile: string) =>
      `Эта команда перезапишет существующий профиль '${profile}'. Продолжить?`,
    createNewProfile: (profile: string) => `Эта команда создаст новый профиль '${profile}'`,
    enterToken: 'Введите ваш персональный токен доступа',
    usingCustomApiUrl: (url: string) => `Используется пользовательский API URL ${url} для получения рабочих пространств`,
    whichWorkspace: 'В какое рабочее пространство вы хотите войти?',
    couldNotListWorkspaces: 'Не удалось получить список рабочих пространств',
    loginFailedCheckCredentials: 'Вход не удался. Проверьте ваши учётные данные',
    loggedIn: 'Вход выполнен',
  },

  // ===== СООБЩЕНИЯ LOGOUT =====
  logout: {
    loggingOut: 'Выход из системы...',
    logoutSuccess: 'Вы вышли из системы',
    notLoggedIn: 'Вы не авторизованы',
  },

  // ===== СООБЩЕНИЯ BUILD =====
  build: {
    building: 'Сборка проекта...',
    buildSuccess: 'Сборка завершена успешно',
    buildFailed: 'Сборка не удалась',
    generatingTypes: 'Генерация типов...',
    typesGenerated: 'Типы сгенерированы',
    bundling: 'Упаковка кода...',
    bundled: 'Код упакован',
  },

  // ===== СООБЩЕНИЯ DEV =====
  dev: {
    startingDevServer: 'Запуск сервера разработки...',
    devServerRunning: (url: string) => `Сервер разработки запущен на ${url}`,
    watchingFiles: 'Отслеживание изменений файлов...',
    fileChanged: (file: string) => `Изменён файл: ${file}`,
    rebuilding: 'Пересборка...',
    tunnelConnected: (url: string) => `Туннель подключён: ${url}`,
    pressToStop: 'Нажмите Ctrl+C для остановки',
  },

  // ===== СООБЩЕНИЯ ADD/REMOVE =====
  packages: {
    installing: (pkg: string) => `Установка ${pkg}...`,
    installed: (pkg: string) => `${pkg} установлен`,
    removing: (pkg: string) => `Удаление ${pkg}...`,
    removed: (pkg: string) => `${pkg} удалён`,
    packageNotFound: (pkg: string) => `Пакет "${pkg}" не найден`,
    alreadyInstalled: (pkg: string) => `${pkg} уже установлен`,
  },

  // ===== ТИПЫ ПРОЕКТОВ =====
  projectTypes: {
    bot: 'Бот',
    integration: 'Интеграция',
    plugin: 'Плагин',
    interface: 'Интерфейс',
  },

  // ===== ШАБЛОНЫ =====
  templates: {
    emptyBot: 'Пустой бот',
    emptyIntegration: 'Пустая интеграция',
    emptyPlugin: 'Пустой плагин',
    helloWorld: 'Hello World',
    webhookMessage: 'Webhook-сообщение',
  },
}

export type Translations = typeof ru
