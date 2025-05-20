import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import { TunnelRequest, TunnelResponse } from '@bpinternal/tunnel'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import chalk from 'chalk'
import * as pathlib from 'path'
import * as uuid from 'uuid'
import * as apiUtils from '../api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as tables from '../tables'
import * as utils from '../utils'
import { Worker } from '../worker'
import { BuildCommand } from './build-command'
import { ProjectCommand, ProjectDefinition } from './project-command'

const DEFAULT_BOT_PORT = 8075
const DEFAULT_INTEGRATION_PORT = 8076
const TUNNEL_HELLO_INTERVAL = 5000
const FILEWATCHER_DEBOUNCE_MS = 2000

export type DevCommandDefinition = typeof commandDefinitions.dev
export class DevCommand extends ProjectCommand<DevCommandDefinition> {
  private _initialDef: ProjectDefinition | undefined = undefined

  public async run(): Promise<void> {
    this.logger.warn('This command is experimental and subject to breaking changes without notice.')

    const api = await this.ensureLoginAndCreateClient(this.argv)

    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'interface') {
      throw new errors.BotpressCLIError('This feature is not available for interfaces.')
    }
    this._initialDef = projectDef

    let env: Record<string, string> = {
      ...process.env,
      BP_API_URL: api.url,
      BP_TOKEN: api.token,
    }

    let defaultPort = DEFAULT_BOT_PORT
    if (this._initialDef.type === 'integration') {
      defaultPort = DEFAULT_INTEGRATION_PORT
      // TODO: store secrets in local cache to avoid prompting every time
      const secretEnvVariables = await this.promptSecrets(this._initialDef.definition, this.argv, { formatEnv: true })
      const nonNullSecretEnvVariables = utils.records.filterValues(secretEnvVariables, utils.guards.is.notNull)
      env = { ...env, ...nonNullSecretEnvVariables }
    }

    const port = this.argv.port ?? defaultPort

    const urlParseResult = utils.url.parse(this.argv.tunnelUrl)
    if (urlParseResult.status === 'error') {
      throw new errors.BotpressCLIError(`Invalid tunnel URL: ${urlParseResult.error}`)
    }

    const tunnelId = uuid.v4()

    const { url: parsedTunnelUrl } = urlParseResult
    const isSecured = parsedTunnelUrl.protocol === 'https' || parsedTunnelUrl.protocol === 'wss'

    const wsTunnelUrl: string = utils.url.format({ ...parsedTunnelUrl, protocol: isSecured ? 'wss' : 'ws' })
    const httpTunnelUrl: string = utils.url.format({
      ...parsedTunnelUrl,
      protocol: isSecured ? 'https' : 'http',
      path: `/${tunnelId}`,
    })

    let worker: Worker | undefined = undefined

    const supervisor = new utils.tunnel.TunnelSupervisor(wsTunnelUrl, tunnelId, this.logger)
    supervisor.events.on('connected', ({ tunnel }) => {
      // prevents the tunnel from closing due to inactivity
      const timer = setInterval(() => {
        if (tunnel.closed) {
          return handleClose()
        }
        tunnel.hello()
      }, TUNNEL_HELLO_INTERVAL)
      const handleClose = (): void => clearInterval(timer)
      tunnel.events.on('close', handleClose)

      tunnel.events.on('request', (req) => {
        if (!worker) {
          this.logger.debug('Worker not ready yet, ignoring request')
          tunnel.send({ requestId: req.id, status: 503, body: 'Worker not ready yet' })
          return
        }

        void this._forwardTunnelRequest(`http://localhost:${port}`, req)
          .then((res) => {
            tunnel.send(res)
          })
          .catch((thrown) => {
            const err = errors.BotpressCLIError.wrap(thrown, 'An error occurred while handling request')
            this.logger.error(err.message)
            tunnel.send({
              requestId: req.id,
              status: 500,
              body: err.message,
            })
          })
      })
    })

    supervisor.events.on('manuallyClosed', () => {
      this.logger.debug('Tunnel manually closed')
    })

    await supervisor.start()

    await this._runBuild()
    await this._deploy(api, httpTunnelUrl)
    worker = await this._spawnWorker(env, port)

    try {
      const watcher = await utils.filewatcher.FileWatcher.watch(
        this.argv.workDir,
        async (events) => {
          if (!worker) {
            this.logger.debug('Worker not ready yet, ignoring file change event')
            return
          }

          const typescriptEvents = events.filter((e) => pathlib.extname(e.path) === '.ts')
          if (typescriptEvents.length === 0) {
            return
          }

          this.logger.log('Changes detected, rebuilding')
          await this._restart(api, worker, httpTunnelUrl)
        },
        {
          ignore: [this.projectPaths.abs.outDir],
          debounceMs: FILEWATCHER_DEBOUNCE_MS,
        }
      )

      await Promise.race([worker.wait(), watcher.wait(), supervisor.wait()])

      if (worker.running) {
        await worker.kill()
      }
      await watcher.close()
      supervisor.close()
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'An error occurred while running the dev server')
    } finally {
      if (worker.running) {
        await worker.kill()
      }
    }
  }

  private _restart = async (api: apiUtils.ApiClient, worker: Worker, tunnelUrl: string) => {
    try {
      await this._runBuild()
    } catch (thrown) {
      const error = errors.BotpressCLIError.wrap(thrown, 'Build failed')
      this.logger.error(error.message)
      return
    }

    await this._deploy(api, tunnelUrl)
    await worker.reload()
  }

  private _deploy = async (api: apiUtils.ApiClient, tunnelUrl: string) => {
    const projectDef = await this.readProjectDefinitionFromFS()

    if (projectDef.type === 'interface') {
      throw new errors.BotpressCLIError('This feature is not available for interfaces.')
    }
    if (projectDef.type === 'integration') {
      this._checkSecrets(projectDef.definition)
      return await this._deployDevIntegration(api, tunnelUrl, projectDef.definition)
    }
    if (projectDef.type === 'bot') {
      return await this._deployDevBot(api, tunnelUrl, projectDef.definition)
    }
    throw new errors.UnsupportedProjectType()
  }

  private _checkSecrets(integrationDef: sdk.IntegrationDefinition) {
    if (this._initialDef?.type !== 'integration') {
      return
    }
    const initialSecrets = this._initialDef?.definition.secrets ?? {}
    const currentSecrets = integrationDef.secrets ?? {}
    const newSecrets = Object.keys(currentSecrets).filter((s) => !initialSecrets[s])
    if (newSecrets.length > 0) {
      throw new errors.BotpressCLIError('Secrets were added while the server was running. A restart is required.')
    }
  }

  private _spawnWorker = async (env: Record<string, string>, port: number) => {
    const outfile = this.projectPaths.abs.outFileCJS
    const importPath = utils.path.toUnix(outfile)
    const code = `require('${importPath}').default.start(${port})`
    const worker = await Worker.spawn(
      {
        type: 'code',
        code,
        env,
      },
      this.logger
    ).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not start dev worker')
    })

    return worker
  }

  private _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private async _deployDevIntegration(
    api: apiUtils.ApiClient,
    externalUrl: string,
    integrationDef: sdk.IntegrationDefinition
  ): Promise<void> {
    const devId = await this.projectCache.get('devId')

    let integration: client.Integration | undefined = undefined

    if (devId) {
      const resp = await api.client.getIntegration({ id: devId }).catch(async (thrown) => {
        const err = errors.BotpressCLIError.wrap(thrown, `Could not find existing dev integration with id "${devId}"`)
        this.logger.warn(err.message)
        return { integration: undefined }
      })

      if (resp.integration?.dev) {
        integration = resp.integration
      } else {
        await this.projectCache.rm('devId')
      }
    }

    const line = this.logger.line()
    line.started(`Deploying dev integration ${chalk.bold(integrationDef.name)}...`)

    const createIntegrationBody = {
      ...(await this.prepareCreateIntegrationBody(integrationDef)),
      ...(await this.prepareIntegrationDependencies(integrationDef, api)),
      url: externalUrl,
    }

    if (integration) {
      const updateIntegrationBody = apiUtils.prepareUpdateIntegrationBody(
        { ...createIntegrationBody, id: integration.id },
        integration
      )

      const resp = await api.client.updateIntegration(updateIntegrationBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not update dev integration "${integrationDef.name}"`)
      })
      integration = resp.integration
    } else {
      const resp = await api.client.createIntegration({ ...createIntegrationBody, dev: true }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not deploy dev integration "${integrationDef.name}"`)
      })
      integration = resp.integration
    }

    line.success(`Dev Integration deployed with id "${integration.id}" at "${externalUrl}"`)
    line.commit()

    await this.projectCache.set('devId', integration.id)
  }

  private async _deployDevBot(api: apiUtils.ApiClient, externalUrl: string, botDef: sdk.BotDefinition): Promise<void> {
    const devId = await this.projectCache.get('devId')

    let bot: client.Bot | undefined = undefined

    if (devId) {
      const resp = await api.client.getBot({ id: devId }).catch(async (thrown) => {
        const err = errors.BotpressCLIError.wrap(thrown, `Could not find existing dev bot with id "${devId}"`)
        this.logger.warn(err.message)
        return { bot: undefined }
      })

      if (resp.bot?.dev) {
        bot = resp.bot
      } else {
        await this.projectCache.rm('devId')
      }
    }

    if (!bot) {
      const createLine = this.logger.line()
      createLine.started('Creating dev bot...')
      const resp = await api.client
        .createBot({
          dev: true,
          url: externalUrl,
        })
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not deploy dev bot')
        })

      bot = resp.bot
      createLine.log('Dev Bot created')
      createLine.commit()
      await this.projectCache.set('devId', bot.id)
    }

    const updateLine = this.logger.line()
    updateLine.started('Deploying dev bot...')

    const updateBotBody = apiUtils.prepareUpdateBotBody(
      {
        ...(await apiUtils.prepareCreateBotBody(botDef)),
        ...(await this.prepareBotDependencies(botDef, api)),
        id: bot.id,
        url: externalUrl,
      },
      bot
    )

    const { bot: updatedBot } = await api.client.updateBot(updateBotBody).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not deploy dev bot')
    })
    updateLine.success(`Dev Bot deployed with id "${updatedBot.id}" at "${externalUrl}"`)
    updateLine.commit()

    const tablesPublisher = new tables.TablesPublisher({ api, logger: this.logger, prompt: this.prompt })
    await tablesPublisher.deployTables({ botId: updatedBot.id, botDefinition: botDef })

    this.displayWebhookUrls(updatedBot)
  }

  private _forwardTunnelRequest = async (baseUrl: string, request: TunnelRequest): Promise<TunnelResponse> => {
    const axiosConfig = {
      method: request.method,
      url: this._formatLocalUrl(baseUrl, request),
      headers: request.headers,
      data: request.body,
      responseType: 'text',
      validateStatus: () => true,
    } satisfies AxiosRequestConfig

    this.logger.debug(`Forwarding request to ${axiosConfig.url}`)
    const response = await axios(axiosConfig)
    this.logger.debug('Sending back response up the tunnel')

    return {
      requestId: request.id,
      status: response.status,
      headers: this._getHeaders(response.headers),
      body: response.data,
    }
  }

  private _formatLocalUrl = (baseUrl: string, req: TunnelRequest): string => {
    if (req.query) {
      return `${baseUrl}${req.path}?${req.query}`
    }
    return `${baseUrl}${req.path}`
  }

  private _getHeaders = (res: AxiosResponse['headers']): TunnelResponse['headers'] => {
    const headers: TunnelResponse['headers'] = {}
    for (const key in res) {
      if (typeof res[key] === 'string' || typeof res[key] === 'number') {
        headers[key] = String(res[key])
      }
    }
    return headers
  }
}
