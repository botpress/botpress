import express from 'express'

export abstract class BaseRouter {
  protected _router = express.Router()

  constructor() {
    this.setupRoutes()
  }

  protected abstract setupRoutes(): void

  abstract get router()
}
