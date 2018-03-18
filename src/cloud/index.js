import fs from 'fs'
import path from 'path'
import axios from 'axios'
import ms from 'ms'
import _ from 'lodash'

module.exports = ({ projectLocation, botfile, logger }) => {
  let certificate = null
  setInterval(() => (certificate = null), ms('5 minutes'))

  function _readCloudfile() {
    const filePath = path.resolve(projectLocation, 'bp-cloud.json')
    if (!fs.existsSync(filePath)) {
      throw new Error(
        'Could not find `bp-cloud.json` file at project root. Have you run "botpress cloud-pair" command?'
      )
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }

  function getCloudEndpoint() {
    return _readCloudfile().endpoint
  }

  function getPairingInfo() {
    return _.pick(_readCloudfile(), ['botId', 'endpoint', 'token', 'teamId'])
  }

  function isPaired() {
    const filePath = path.resolve(projectLocation, 'bp-cloud.json')
    return fs.existsSync(filePath)
  }

  async function _getWellKnownRSACert() {
    if (certificate) {
      return certificate
    }

    const endpoint = getCloudEndpoint()
    const { data } = await axios.get(endpoint + '/api/.well-known/public.key')

    if (data && data.length) {
      certificate = data
    }

    logger.debug('[Cloud] Updated certificates')

    return data
  }

  async function updateRemoteEnv() {
    if (!isPaired()) {
      return
    }

    const { token, endpoint } = getPairingInfo()
    const env = botfile.env
    const botUrl = botfile.botUrl

    await axios
      .put(endpoint + '/api/pairing/env', {
        botUrl,
        token,
        env
      })
      .then(() => {
        logger.debug('[Cloud] Updated environment: ' + env)
      })
      .catch(err => {
        const message = _.get(err, 'response.data.message') || err.message || 'Unknown error'
        logger.error('[Cloud] Could not update environment: ' + message)
      })
  }

  function _getRemoteRoles() {}
  function getUserRoles() {}

  return { getCloudEndpoint, getCertificate: _getWellKnownRSACert, isPaired, getPairingInfo, updateRemoteEnv }
}
