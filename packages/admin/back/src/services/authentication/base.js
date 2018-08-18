import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'

import { UnauthorizedAccessError, TokenExpiredError } from '~/errors'

import TeamService from '../team'

const debug = require('debug')('svc:authentication')

export default ({ config, db }) => {
  const team = TeamService({ config, db })

  const adjs = fs
    .readFileSync(path.resolve('./lang/dic-users-adj.txt'))
    .toString()
    .split(/\n|\r\n|,/gi)

  const nouns = fs
    .readFileSync(path.resolve('./lang/dic-users-noun.txt'))
    .toString()
    .split(/\n|\r\n|,/gi)

  function getRandomUsername() {
    return (
      _.sample(adjs).trim() +
      '-' +
      _.sample(nouns).trim() +
      '-' +
      Math.random()
        .toString()
        .substr(2, 4)
    )
  }

  function getPublicKey() {
    const file = path.resolve('./keys/jwt.key.pub')
    return fs.readFileSync(file, 'UTF8')
  }

  function _getPrivateKey() {
    const file = path.resolve('./keys/jwt.key')
    return fs.readFileSync(file, 'UTF8')
  }

  function generateBotJWT(botId, userTeamInfo) {
    const expiresIn = '6h'
    const audience = 'urn:bot/' + botId
    const payload = {
      user: {
        id: userTeamInfo.username,
        username: userTeamInfo.username,
        email: userTeamInfo.email,
        first_name: userTeamInfo.firstName,
        last_name: userTeamInfo.lastName,
        avatar_url: userTeamInfo.picture,
        roles: [userTeamInfo.role]
      }
    }

    const cert = _getPrivateKey()

    return jwt.sign(payload, cert, { algorithm: 'RS256', expiresIn, audience, issuer: process.env.JWT_ISSUER })
  }

  function generateIdentityJWT(botId, userTeamInfo) {
    const expiresIn = '6h'
    const audience = 'urn:bot/' + botId
    const payload = {
      identity_proof_only: true,
      user: {
        id: userTeamInfo.username,
        username: userTeamInfo.username,
        email: userTeamInfo.email,
        first_name: userTeamInfo.firstName,
        last_name: userTeamInfo.lastName,
        avatar_url: userTeamInfo.picture,
        roles: []
      }
    }

    const cert = _getPrivateKey()

    return jwt.sign(payload, cert, { algorithm: 'RS256', expiresIn, audience, issuer: process.env.JWT_ISSUER })
  }

  async function getOrCreateCliToken(userId, refresh = false) {
    if (refresh) {
      await db.models.cli_token.destroy({ where: { userId } })
      const cliToken = nanoid()
      return db.models.cli_token.create({
        userId,
        validUntil: moment()
          .add(ms(process.env.CLI_TOKEN_EXPIRY), 'milliseconds')
          .toDate(),
        cliToken
      })
    } else {
      let cli = await db.models.cli_token.findOne({ where: { userId } })

      // If token not found or if previous token expired
      if (!cli || moment(cli.validUntil).isBefore(moment())) {
        const cliToken = nanoid()
        cli = await db.models.cli_token.create({
          userId,
          validUntil: moment()
            .add(ms(process.env.CLI_TOKEN_EXPIRY), 'milliseconds')
            .toDate(),
          cliToken
        })
      }

      return cli
    }
  }

  async function getUserIdFromCliToken(cliToken) {
    debug('Authenticating user with CLI token')
    const cli = await db.models.cli_token.findOne({ where: { cliToken } })

    const getNewTokenMsg = `Visit ${process.env.SERVICE_URL}/me/cli to get a new token.`

    if (!cli) {
      throw new UnauthorizedAccessError('Invalid CLI token. ' + getNewTokenMsg)
    }

    if (moment(cli.validUntil).isBefore(moment())) {
      throw new TokenExpiredError(getNewTokenMsg)
    }

    return cli.userId
  }

  return { generateBotJWT, generateIdentityJWT, getUserIdFromCliToken, getOrCreateCliToken, getRandomUsername }
}
