import { Logger, StrategyUser } from 'botpress/sdk'
import { RequestWithUser, TokenResponse } from 'common/typings'
import { AuthStrategyBasic } from 'core/config'
import { asyncMiddleware, sendSuccess, BadRequestError, ConflictError } from 'core/routers'
import { Request, Router, Response } from 'express'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import { nanoid } from 'nanoid'
import { charsets, PasswordPolicy } from 'password-sheriff'

import { InvalidCredentialsError, LockedOutError, PasswordExpiredError, WeakPasswordError } from './auth-errors'
import { AuthService, SERVER_USER } from './auth-service'
import { saltHashPassword, validateHash } from './utils'
import { ZXCVBNPolicy, ZXCVBNPolicyOptions } from './zxcvbn-password-policy'

const debug = DEBUG('audit:users:basic')

export class StrategyBasic {
  private asyncMiddleware: Function

  constructor(private logger: Logger, private router: Router, private authService: AuthService) {
    this.asyncMiddleware = asyncMiddleware(logger, 'BasicStrategy')
  }

  async setup() {
    if (process.env.BP_ADMIN_EMAIL && process.env.BP_ADMIN_PASSWORD && (await this.authService.isFirstUser())) {
      this.logger.info(`Creating user ${process.env.BP_ADMIN_EMAIL}`)
      await this._register(process.env.BP_ADMIN_EMAIL, 'default', process.env.BP_ADMIN_PASSWORD, '0.0.0.0')
    }
    const router = this.router
    router.post(
      '/login/basic/:strategy',
      this.asyncMiddleware(async (req: Request, res: Response) => {
        const { password, newPassword, channel, target } = req.body
        const email = req.body.email.toLowerCase()
        const { strategy } = req.params

        // Random delay to prevent an attacker from determining if an account exists by the response time. Arbitrary numbers
        await Promise.delay(_.random(15, 80))

        await this._login(email, password, strategy, newPassword, req.ip)
        let token: TokenResponse

        // If the channel & target is set, we consider that it's a chat user logging in (even if it's with admin credentials)
        if (channel && target) {
          token = await this.authService.generateChatUserToken(email, strategy, channel, target)
        } else {
          token = await this.authService.generateSecureToken(email, strategy)
        }

        if (await this.authService.setJwtCookieResponse(token, res)) {
          return sendSuccess(res, 'Login successful', _.omit(token, 'jwt'))
        }

        return sendSuccess(res, 'Login successful', token)
      })
    )

    router.post(
      '/register/basic/:strategyId',
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { strategyId } = req.params

        if (!(await this.authService.isFirstUser())) {
          return res.status(403).send('Registration is disabled')
        }

        const { email, password } = req.body
        if (email.length < 4 || password.length < 4) {
          throw new BadRequestError('Email or password is too short.')
        }

        const token = await this._register(email, strategyId, password, req.ip)
        return sendSuccess(res, 'Registration successful', token)
      })
    )
  }

  async resetPassword(email: string, strategy: string): Promise<string> {
    const password = nanoid(15)
    const { hash, salt } = saltHashPassword(password)

    await this.authService.updateUser(email, strategy, { password: hash, salt })
    await this.authService.updateAttributes(email, strategy, { password_expired: true })

    debug('password reset %o', { email })

    return password
  }

  private async _login(
    email: string,
    password: string,
    strategy: string,
    newPassword?: string,
    ipAddress: string = ''
  ): Promise<void> {
    await this._checkUserAuth(email, strategy, password, newPassword, ipAddress)
    const strategyOptions = _.get(await this.authService.getStrategy(strategy), 'options') as AuthStrategyBasic

    if (newPassword) {
      if (password === newPassword) {
        throw new WeakPasswordError('New password should not match old password')
      }

      this._validatePassword(newPassword, strategyOptions)
      const hash = saltHashPassword(newPassword)

      await this.authService.updateUser(email, strategy, {
        password: hash.hash,
        salt: hash.salt,
        ...this._addPasswordExpiry(strategyOptions)
      })

      await this.authService.updateAttributes(email, strategy, { password_expired: false })
    }

    debug('login', { email, ipAddress })

    await this.authService.updateAttributes(email, strategy, {
      last_ip: ipAddress,
      unsuccessful_logins: 0,
      last_login_attempt: undefined,
      locked_out: false,
      last_logon: new Date()
    })
  }

  private async _register(
    email: string,
    strategy: string,
    password: string,
    ipAddress: string = ''
  ): Promise<TokenResponse> {
    const pw = saltHashPassword(password)

    if (await this.authService.findUser(email, strategy)) {
      throw new ConflictError('The user already exists for that strategy.')
    }

    const newUser = {
      email,
      password: pw.hash,
      salt: pw.salt,
      strategy,
      attributes: {
        last_ip: ipAddress,
        last_logon: new Date()
      }
    }

    await this.authService.createUser(newUser, strategy)

    debug('self register', { email, ipAddress })
    return this.authService.generateSecureToken(email, strategy)
  }

  private async _checkUserAuth(
    email: string,
    strategy: string,
    password: string,
    newPassword?: string,
    ipAddress: string = ''
  ) {
    if (email === SERVER_USER) {
      debug('user tried to login with server user %o', { email, ipAddress })
      throw new InvalidCredentialsError()
    }

    const user = await this.authService.findUser(email, strategy)
    if (!user) {
      debug('login failed; user does not exist %o', { email, ipAddress })
      throw new InvalidCredentialsError()
    }

    const strategyOptions = _.get(await this.authService.getStrategy(strategy), 'options') as AuthStrategyBasic
    const { locked_out, last_login_attempt, password_expiry_date, password_expired } = user.attributes

    if (locked_out) {
      const { lockoutDuration } = strategyOptions

      const lockExpired = lockoutDuration && moment().isAfter(moment(last_login_attempt).add(ms(lockoutDuration)))
      if (!lockoutDuration || !lockExpired) {
        debug('login failed; user locked out %o', { email, ipAddress })
        throw new LockedOutError()
      }
    }

    if (!validateHash(password || '', user.password!, user.salt!)) {
      debug('login failed; wrong password %o', { email, ipAddress })
      // this.stats.track('auth', 'login', 'fail')

      await this._incrementWrongPassword(user, strategyOptions)
      throw new InvalidCredentialsError()
    }

    const isDateExpired = password_expiry_date && moment().isAfter(password_expiry_date)
    if ((password_expired || isDateExpired) && !newPassword) {
      throw new PasswordExpiredError()
    }

    return user.email
  }

  private async _incrementWrongPassword(user: StrategyUser, options?: AuthStrategyBasic): Promise<void> {
    const invalidLoginCount = (user.attributes.unsuccessful_logins || 0) + 1
    const shouldLock = options && options.maxLoginAttempt && invalidLoginCount > options.maxLoginAttempt

    await this.authService.updateAttributes(user.email, user.strategy, {
      unsuccessful_logins: invalidLoginCount,
      last_login_attempt: new Date(),
      ...(shouldLock && { locked_out: true })
    })
  }

  private _validatePassword(password: string, options?: AuthStrategyBasic): void {
    if (!options) {
      return
    }

    const rules: any = {}
    if (options.passwordMinLength) {
      rules.length = { minLength: options.passwordMinLength }
    }

    if (options.requireComplexPassword) {
      rules.contains = {
        expressions: [charsets.lowerCase, charsets.upperCase, charsets.numbers, charsets.specialCharacters]
      }
    }

    try {
      const basicChecker = new PasswordPolicy(rules)
      basicChecker.assert(password)
      if (options.requireComplexPassword) {
        const smartChecker = new PasswordPolicy(
          { zxcvbn: <ZXCVBNPolicyOptions>{ minScore: 2, failWhenCommonWordIsDominant: true } },
          { zxcvbn: new ZXCVBNPolicy() }
        )
        smartChecker.assert(password)
      }
    } catch (err) {
      throw new WeakPasswordError()
    }
  }

  private _addPasswordExpiry(options?: AuthStrategyBasic): object {
    if (!options || !options.passwordExpiryDelay) {
      return {}
    }

    return {
      password_expiry_date: moment()
        .add(ms(options.passwordExpiryDelay))
        .toDate()
    }
  }
}
