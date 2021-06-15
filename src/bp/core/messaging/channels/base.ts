import { HTTPServer } from 'core/app/server'

export abstract class Channel {
  abstract get name(): string

  abstract loadConfigForBot(botId: string): Promise<any>

  abstract setupRoutes(http: HTTPServer)
}
