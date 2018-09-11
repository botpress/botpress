import { Router } from 'express'

export * from './modules'
export * from './bots'
export * from './admin-router'
export * from './logs'

export interface CustomRouter {
  readonly router: Router
}
