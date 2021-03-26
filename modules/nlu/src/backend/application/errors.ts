export class BotNotMountedError extends Error {
  constructor(botId: string) {
    super(`Bot ${botId} is not mounted.`)
  }
}

export class BotDoesntSpeakLanguageError extends Error {
  constructor(botId: string, language: string) {
    super(`Bot ${botId} does not speak ${language}.`)
  }
}
