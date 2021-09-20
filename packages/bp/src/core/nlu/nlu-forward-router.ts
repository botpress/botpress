import { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import { CustomRouter } from 'core/routers/customRouter'
import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import path from 'path'
import { NLUInferenceService } from './nlu-service'

interface Config {
  forBot: boolean
}

export class NLUProxyRouter extends CustomRouter {
  constructor(logger: sdk.Logger, private nluService: NLUInferenceService, private config: Config) {
    super('NLU-PROXY', logger, Router({ mergeParams: true }))

    // setup routes in background
    void this.setupRoutes()
  }

  public async setupRoutes(): Promise<void> {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)
    this.router.get('*', this._redirect('GET').bind(this))
    this.router.post('*', this._redirect('POST').bind(this))
  }

  private _redirect = (method: 'GET' | 'POST') => async (req: ExpressRequest, res: ExpressResponse) => {
    const { baseUrl, headers, query, body, originalUrl } = req

    const targetURL = path.relative(baseUrl, originalUrl)

    const axios = this.config.forBot ? this._getAxiosForBot(req) : this._getGlobalAxios()
    if (!axios) {
      return res.status(404).send(undefined)
    }

    if (method === 'POST') {
      const { data: responseBody } = await axios.post(targetURL, body, { headers })
      return res.send(responseBody)
    }
    const { data: responseBody } = await axios.get(targetURL, { headers, params: query })
    return res.send(responseBody)
  }

  private _getAxiosForBot(req: ExpressRequest): AxiosInstance | undefined {
    const { botId } = req.params
    return this.nluService.clientsPerBot[botId]?.axios
  }

  private _getGlobalAxios(): AxiosInstance | undefined {
    return this.nluService.baseClient?.axios
  }
}
