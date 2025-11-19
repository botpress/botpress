import VError from 'verror'
import * as errors from '../errors'
import type { Logger } from '../logger'
import type { CommandArgv, CommandDefinition } from '../typings'

export abstract class BaseCommand<C extends CommandDefinition> {
  public constructor(
    protected readonly logger: Logger,
    protected readonly argv: CommandArgv<C>
  ) {}

  protected abstract run(): Promise<void>
  protected bootstrap?(): Promise<void>
  protected teardown?(): Promise<void>

  private get _cmdName(): string {
    return this.constructor.name
  }

  public async handler(): Promise<{ exitCode: number }> {
    let exitCode = 0
    try {
      if (this.bootstrap) {
        await this.bootstrap()
      }
      await this.run()
    } catch (thrown) {
      const error = errors.BotpressCLIError.map(thrown)

      error.message = `[${this._cmdName}] ${error.message}`
      this.logger.error(error.message)
      this.logger.debug(VError.fullStack(error))

      exitCode = 1
    } finally {
      if (this.teardown) {
        await this.teardown()
      }
    }

    return { exitCode }
  }
}
