import { BotConfig } from './bot.config'

export class BotConfigBuilder {
  private schema = '../../bot.config.schema.json'
  private active = false
  private version = '0.0.1'
  private description: string | undefined
  private license: string | undefined
  private author: string | undefined
  private contentTypes: string[] = []
  private modules: string[] = []
  private outgoingMiddleware: string[] = []
  private incomingMiddleware: string[] = []

  constructor(private name: string, private id: string) {}

  withDescription(description: string ): this {
    this.description = description
    return this
  }

  withlicense(license: string): this {
    this.license = license
    return this
  }

  withAuthor(author: string): this {
    this.author = author
    return this
  }

  withContentTypes(...contentTypes: string[]): this {
    this.contentTypes = contentTypes
    return this
  }

  withModules(...modules: string[]): this {
    this.modules = modules
    return this
  }

  withVersion(version: string): this {
    this.version = version
    return this
  }

  withIncomingMiddleware(...incoming: string[]) {
    this.incomingMiddleware = incoming
    return this
  }

  withOugoingMiddleware(...outgoing: string[]) {
    this.outgoingMiddleware = outgoing
    return this
  }

  enabled(active: boolean): this {
    this.active = active
    return this
  }

  build(): BotConfig {
    return {
      $schema: this.schema,
      active: this.active,
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      license: this.license,
      author: this.author,
      imports: {
        modules: this.modules,
        contentTypes: this.contentTypes,
        incomingMiddleware: this.incomingMiddleware,
        outgoingMiddleware: this.outgoingMiddleware
      }
    }
  }
}
