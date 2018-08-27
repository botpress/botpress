import { Request, Router } from 'express'

export type SubRouter = Router

export type RouterCondition = boolean | ((req: Request) => boolean)

export type RouterOptions = {
  checkAuthentication: RouterCondition
  enableJsonBodyParser: RouterCondition
}

export interface HttpAPI {
  createShortLink(): void
  getBotSpecificRouter(module: string, options?: RouterOptions): SubRouter
}
