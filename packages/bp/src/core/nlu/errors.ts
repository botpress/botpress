export class BotNotMountedError extends Error {
  constructor(botId: string) {
    super(`No predictor found for bot "${botId}" in nlu service.`)
  }
}

export class BotNotTrainedInLanguageError extends Error {
  constructor(botId: string, languages: string[]) {
    super(`Bot "${botId}" was not trained in languages [${languages.join(', ')}]. Please train your chatbot.`)
  }
}

export class HTTPError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
