import { Logger } from 'botpress/sdk'
import { CreatedUser } from 'core/misc/interfaces'
import AuthService from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from '..'
import { ConflictError } from '../errors'
import {
  assertBotpressPro,
  asyncMiddleware,
  needPermissions,
  success as sendSuccess,
  validateBodySchema
} from '../util'

export class UsersRouter implements CustomRouter {
  public readonly router: Router

  private readonly resource = 'admin.users'
  private asyncMiddleware!: Function
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private assertBotpressPro: RequestHandler

  constructor(logger: Logger, private authService: AuthService, private workspaceService: WorkspaceService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.needPermissions = needPermissions(this.workspaceService)
    this.assertBotpressPro = assertBotpressPro(this.workspaceService)
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const users = await this.workspaceService.listUsers([
          'email',
          'firstname',
          'lastname',
          'role',
          'last_logon',
          'created_on'
        ])
        return sendSuccess(res, 'Retrieved users', users)
      })
    )

    router.post(
      '/',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            email: Joi.string()
              .email()
              .trim()
              .required()
          })
        )
        const email = req.body.email
        const alreadyExists = await this.authService.findUserByEmail(email, ['email'])

        if (alreadyExists) {
          throw new ConflictError(`User "${email}" is already taken`)
        }

        const createdUser: CreatedUser = await this.authService.createUser({ email })

        return sendSuccess(res, 'User created successfully', {
          email,
          tempPassword: createdUser.password
        })
      })
    )

    router.delete(
      '/:email',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email } = req.params

        if (req.authUser.email === email) {
          return res.status(400).json({ message: "Sorry, you can't delete your own account." })
        }

        await this.workspaceService.deleteUser(email)
        return sendSuccess(res, 'User deleted', {
          email
        })
      })
    )

    router.get(
      '/reset/:userId',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const tempPassword = await this.authService.resetPassword(req.params.userId)
        return sendSuccess(res, 'Password reseted', {
          tempPassword
        })
      })
    )

    router.put(
      '/:email',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email } = req.params

        await this.authService.updateUser(email, req.body)
        return sendSuccess(res, 'User updated')
      })
    )
  }
}
