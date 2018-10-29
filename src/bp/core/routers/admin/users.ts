import { Logger } from 'botpress/sdk'
import { AdminService } from 'core/services/admin/service'
import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from '..'
import AuthService from '../../services/auth/auth-service'
import { InvalidOperationError } from '../../services/auth/errors'
import { asyncMiddleware, error as sendError, success as sendSuccess, validateBodySchema } from '../util'

export class UsersRouter implements CustomRouter {
  private asyncMiddleware!: Function
  public readonly router: Router

  constructor(logger: Logger, private authService: AuthService, private adminService: AdminService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.adminService

    router.get(
      '/', // List users
      this.asyncMiddleware(async (req, res) => {
        const users = await svc.listUsers()
        return sendSuccess(res, 'Retrieved users', users)
      })
    )

    router.post(
      '/', // Create user
      this.asyncMiddleware(async (req, res) => {
        await svc.assertIsRootAdmin(req.dbUser.id)
        validateBodySchema(
          req,
          Joi.object().keys({
            username: Joi.string()
              .email()
              .trim()
              .required()
          })
        )
        const username = req.body.username
        const alreadyExists = await this.authService.findUserByUsername(username, ['id'])

        if (alreadyExists) {
          throw new InvalidOperationError(`User ${username} is already taken`)
        }

        const tempPassword = await svc.createUser(username)

        return sendSuccess(res, 'User created successfully', {
          username,
          tempPassword
        })
      })
    )

    router.delete(
      '/:userId', // Delete user
      this.asyncMiddleware(async (req, res) => {
        await svc.assertIsRootAdmin(req.dbUser.id)
        const { userId } = req.params

        if (userId == 1) {
          throw new InvalidOperationError(`You cannot delete the main admin account.`)
        }

        await svc.deleteUser(userId)
        return sendSuccess(res, 'User deleted', {
          userId
        })
      })
    )

    router.get(
      '/reset/:userId',
      this.asyncMiddleware(async (req, res) => {
        await svc.assertIsRootAdmin(req.dbUser.id)
        const tempPassword = await svc.resetPassword(req.params.userId)
        return sendSuccess(res, 'Password reseted', {
          tempPassword
        })
      })
    )
  }
}
